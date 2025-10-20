import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import NodeGeocoder, { Geocoder } from 'node-geocoder';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private geocoder: Geocoder;

  constructor(private prisma: PrismaService) {
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
    if (!report) throw new NotFoundException(`Звернення з ID "${id}" не знайдено`);
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

  async create(createReportDto: CreateReportDto, userId: string) {
    const { title, description, lat, lng, address, categoryId, recipientId } = createReportDto;

    let latitude: Decimal | null = null;
    let longitude: Decimal | null = null;

    if (lat != null && lng != null) {
      latitude = new Decimal(lat);
      longitude = new Decimal(lng);
    } else if (address) {
      const geoResult = await this.geocoder.geocode(address);
      if (!geoResult?.length) throw new BadRequestException(`Не вдалося знайти координати для адреси: ${address}`);
      latitude = new Decimal(geoResult[0].latitude as number);
      longitude = new Decimal(geoResult[0].longitude as number);
    } else {
      throw new BadRequestException('Необхідно вказати адресу або координати.');
    }

    const newReport = await this.prisma.report.create({
      data: {
        title,
        description,
        lat: latitude,
        lng: longitude,
        authorId: userId,
        categoryId,
        recipientId,
      },
    });

    if (latitude && longitude) {
      await this.prisma.$executeRaw`
        UPDATE "Report"
        SET geom = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        WHERE id = ${newReport.id}
      `;
      this.logger.log(`Оновлено geom для звіту ID: ${newReport.id}`);
    }

    this.logger.log(`Створено нове звернення ID: ${newReport.id}`);
    return newReport;
  }
}
