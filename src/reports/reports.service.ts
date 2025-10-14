import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { PrismaService } from '../prisma.service';
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.report.findMany({
      include: {
        author: true,
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

// @Injectable()
// export class ReportsService {
//   create(createReportDto: CreateReportDto) {
//     return 'This action adds a new report';
//   }

//   findAll() {
//     return `This action returns all reports`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} report`;
//   }

//   update(id: number, updateReportDto: UpdateReportDto) {
//     return `This action updates a #${id} report`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} report`;
//   }
// }
