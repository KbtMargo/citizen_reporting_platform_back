import { Injectable, BadRequestException, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Prisma, ReportStatus } from '@prisma/client';
import { Geocoder } from 'node-geocoder';
import NodeGeocoder = require('node-geocoder');
import { NotificationsService } from '../notifications/notifications.service'; 

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
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
        } catch (e) { this.logger.warn("Не вдалося виконати зворотнє геокодування"); }
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
        this.logger.error(`Помилка геокодування: ${error.message}`);
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

    this.logger.log(`Створено нове звернення ID: ${newReport.id}`);
    return newReport;
  }

//   async update(id: string, updateData: any, userId: string) {
//   try {
//     const report = await this.prisma.report.findUnique({
//       where: { id }
//     });

//     if (!report) {
//       throw new Error('Report not found');
//     }

//     const { notes, ...reportUpdateData } = updateData;

//     const updatedReport = await this.prisma.report.update({
//       where: { id },
//       data: {
//         ...reportUpdateData,
//         updatedAt: new Date(),
//       }
//     });

//     if (notes && notes.trim() !== '') {
//       await this.prisma.reportUpdate.create({
//         data: {
//           description: notes,
//           reportId: id,
//           authorId: userId,
//           createdAt: new Date(),
//         }
//       });
//     }

//     return updatedReport;
//   } catch (error) {
//     console.error('Error updating report:', error);
//     throw error;
//   }
// }

//  async update(id: string, updateData: any, userId: string) {
//     try {
//       const report = await this.prisma.report.findUnique({
//         where: { id },
//         include: { author: true } // ДОДАНО: включаємо автора для сповіщення
//       });

//       if (!report) {
//         throw new Error('Report not found');
//       }

//       const { notes, ...reportUpdateData } = updateData;

//       // Перевіряємо, чи змінився статус
//       const statusChanged = reportUpdateData.status && reportUpdateData.status !== report.status;

//       const updatedReport = await this.prisma.report.update({
//         where: { id },
//         data: {
//           ...reportUpdateData,
//           updatedAt: new Date(),
//         }
//       });

//       if (notes && notes.trim() !== '') {
//         await this.prisma.reportUpdate.create({
//           data: {
//             description: notes,
//             reportId: id,
//             authorId: userId,
//             createdAt: new Date(),
//           }
//         });
//       }

//       // ВІДПРАВЛЯЄМО СПОВІЩЕННЯ ПРИ ЗМІНІ СТАТУСУ
//       if (statusChanged) {
//         const statusMessages = {
//           'NEW': 'Ваше звернення отримано та зареєстровано',
//           'IN_PROGRESS': 'Робота над вашим зверненням розпочата',
//           'DONE': 'Ваше звернення успішно вирішено',
//           'REJECTED': 'Ваше звернення відхилено'
//         };

//         const message = statusMessages[reportUpdateData.status] || 'Статус вашого звернення змінено';

//         await this.notificationsService.create({
//           title: `Оновлення статусу звернення: "${report.title}"`,
//           message: message,
//           userId: report.authorId, // Відправляємо автору звернення
//           reportId: report.id,
//         });

//         this.logger.log(`Сповіщення відправлено автору ${report.authorId} про зміну статусу звернення ${report.id}`);
//       }

//       return updatedReport;
//     } catch (error) {
//       console.error('Error updating report:', error);
//       throw error;
//     }
//   }

async update(id: string, updateData: any, userId: string) {
  try {
    this.logger.log('🔵 [REPORTS SERVICE] Оновлення звернення:', id, updateData);

    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const { notes, ...reportUpdateData } = updateData;

    // Перевіряємо, чи змінився статус
    const statusChanged = reportUpdateData.status && reportUpdateData.status !== report.status;
    this.logger.log(`🟡 [REPORTS SERVICE] Статус змінився?: ${statusChanged} з ${report.status} на ${reportUpdateData.status}`);

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

    // ВІДПРАВЛЯЄМО СПОВІЩЕННЯ ПРИ ЗМІНІ СТАТУСУ
    if (statusChanged) {
      this.logger.log(`🟢 [REPORTS SERVICE] Створюємо сповіщення для користувача: ${report.authorId}`);
      
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

        this.logger.log('🟢 [REPORTS SERVICE] Результат створення сповіщення:', notificationResult);
      } catch (notificationError) {
        this.logger.error('🔴 [REPORTS SERVICE] Помилка створення сповіщення:', notificationError);
      }
    }

    return updatedReport;
  } catch (error) {
    this.logger.error('🔴 [REPORTS SERVICE] Помилка оновлення звернення:', error);
    throw error;
  }
}

}
