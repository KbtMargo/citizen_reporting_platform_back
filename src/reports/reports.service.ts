import { Injectable, BadRequestException, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Prisma, ReportStatus } from '@prisma/client';
import { Geocoder } from 'node-geocoder';
import NodeGeocoder = require('node-geocoder');
import { NotificationsService } from '../notifications/notifications.service'; 

@Injectable()
export class ReportsService {
  private geocoder: Geocoder;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService, 
  ) {
    this.geocoder = NodeGeocoder({ provider: 'openstreetmap' });
  }

  findAll() {
    return this.prisma.report.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        category: true,
        recipient: true,
        files: { take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        category: true,
        recipient: true,
        files: true,
        updates: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!report) {
      throw new NotFoundException(`Звернення з ID "${id}" не знайдено`);
    }
    return report;
  }

  async findMyReports(userId: string) {
    return this.prisma.report.findMany({
      where: { authorId: userId },
      include: {
        author: { select: { firstName: true, lastName: true } },
        category: true,
        recipient: true,
        files: { take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatsForUser(userId: string) {
    const open = await this.prisma.report.count({
      where: {
        authorId: userId,
        status: { in: ['NEW', 'IN_PROGRESS'] },
      },
    });

    const closed = await this.prisma.report.count({
      where: {
        authorId: userId,
        status: { in: ['DONE', 'REJECTED'] },
      },
    });

    return { open, closed };
  }

  async create(createReportDto: CreateReportDto, userId: string, fileKeys: string[] = []) {
    const { title, description, lat, lng, address, categoryId, recipientId } = createReportDto;

    let latitude: Prisma.Decimal;
    let longitude: Prisma.Decimal;
    let finalAddress: string | null | undefined = address;

    if (lat && lng) {
      latitude = new Prisma.Decimal(lat);
      longitude = new Prisma.Decimal(lng);
      if (!finalAddress) {
        try {
          const geoResult = await this.geocoder.reverse({ lat: parseFloat(lat), lon: parseFloat(lng) });
          if (geoResult.length > 0 && geoResult[0].formattedAddress) {
            finalAddress = geoResult[0].formattedAddress;
          }
        } catch (e) { }
      }
    } else if (address) {
      try {
        const geoResult = await this.geocoder.geocode(address);
        if (geoResult && geoResult.length > 0 && geoResult[0].latitude && geoResult[0].longitude) {
          latitude = new Prisma.Decimal(geoResult[0].latitude);
          longitude = new Prisma.Decimal(geoResult[0].longitude);
        } else {
          throw new BadRequestException(`Не вдалося знайти координати для адреси: ${address}`);
        }
      } catch (error) {
        throw new BadRequestException(`Помилка при визначенні координат.`);
      }
    } else {
      throw new BadRequestException('Не надано ані координат, ані адреси.');
    }

    if (!latitude || !longitude) {
        throw new InternalServerErrorException('Не вдалося визначити координати.');
    }

    const newReport = await this.prisma.report.create({
      data: {
        title,
        description,
        lat: latitude,
        lng: longitude,
        address: finalAddress,
        authorId: userId,
        categoryId,
        recipientId,
      },
    });

    await this.prisma.$executeRaw(
      Prisma.sql`UPDATE "Report" SET geom = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326) WHERE id = ${newReport.id}`
    );

    if (fileKeys.length > 0) {
      const bucketName = process.env.S3_BUCKET;
      if (!bucketName) {
        throw new InternalServerErrorException('Назва S3 бакету не налаштована.');
      }
      await this.prisma.file.createMany({
        data: fileKeys.map((key) => ({
          key,
          bucket: bucketName,
          reportId: newReport.id,
        })),
      });
    }

    return newReport;
  }

async update(id: string, updateData: any, userId: string) {
  try {

    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const { notes, ...reportUpdateData } = updateData;

    const statusChanged = reportUpdateData.status && reportUpdateData.status !== report.status;

    const updatedReport = await this.prisma.report.update({
      where: { id },
      data: {
        ...reportUpdateData,
        updatedAt: new Date(),
      }
    });

    if (notes && notes.trim() !== '') {
      await this.prisma.reportUpdate.create({
        data: {
          description: notes,
          reportId: id,
          authorId: userId,
          createdAt: new Date(),
        }
      });
    }

    if (statusChanged) {
      
      const statusMessages = {
        'NEW': 'Ваше звернення отримано та зареєстровано',
        'IN_PROGRESS': 'Робота над вашим зверненням розпочата',
        'DONE': 'Ваше звернення успішно вирішено',
        'REJECTED': 'Ваше звернення відхилено'
      };

      const message = statusMessages[reportUpdateData.status] || 'Статус вашого звернення змінено';

      try {
        const notificationResult = await this.notificationsService.create({
          title: `Оновлення статусу звернення: "${report.title}"`,
          message: message,
          userId: report.authorId,
          reportId: report.id,
          type: 'REPORT_STATUS_CHANGE',
          priority: 'MEDIUM'

        });

      } catch (notificationError) {
      }
    }

    return updatedReport;
  } catch (error) {
    throw error;
  }
}

}
