import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { osbb: true },
    });
    if (!user) throw new NotFoundException('Користувача не знайдено');
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    const { email, ...updateData } = data;
    if (email) console.warn('Електронну пошту не можна змінювати.');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    const { password, ...result } = user;
    return result;
  }

  async getAllReportsStats() {
    const total = await this.prisma.report.count();
    const open = await this.prisma.report.count({
      where: { status: { in: [ReportStatus.NEW, ReportStatus.IN_PROGRESS] } },
    });
    const closed = await this.prisma.report.count({
      where: { status: ReportStatus.DONE },
    });
    const rejected = await this.prisma.report.count({
      where: { status: ReportStatus.REJECTED } ,
    });
    return { total, open, closed, rejected };
  }
}
