import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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


  
}