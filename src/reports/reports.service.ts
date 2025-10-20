import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from 'generated/prisma';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.report.findMany({
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        recipient: true,
        files: {
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc', 
      },
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
          include: {
            author: { select: { firstName: true, lastName: true } },
          },
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
      orderBy: {
        createdAt: 'desc', 
      },
    });
  }
  
  async create(createReportDto: CreateReportDto, userId: string) {
    const { title, description, lat, lng, categoryId, recipientId } = createReportDto;

    // Перетворюємо рядкові координати в Decimal для Prisma
    const latitude = new Prisma.Decimal(lat);
    const longitude = new Prisma.Decimal(lng);

    // TODO: Перевірити, чи існують categoryId та recipientId в базі

    const newReport = await this.prisma.report.create({
      data: {
        title,
        description,
        lat: latitude,
        lng: longitude,
        authorId: userId, // Прив'язуємо до поточного користувача
        categoryId,
        recipientId,
        // Поле 'geom' можна оновити пізніше тригером або окремим запитом
      },
    });
    return newReport;
  }
}