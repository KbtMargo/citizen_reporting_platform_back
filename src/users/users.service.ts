import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReportStatus, UserRole } from '@prisma/client';

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
    const { email, ...updateData } = data as any;
    if (email) console.warn('Електронну пошту не можна змінювати.');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    const { password, ...result } = user;
    return result;
  }

  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    if (userId !== currentUserId) {
      throw new ForbiddenException('Ви можете видалити тільки свій власний акаунт');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async deactivateUser(userId: string, currentUserId: string): Promise<void> {
    if (userId !== currentUserId) {
      throw new ForbiddenException('Ви можете деактивувати тільки свій власний акаунт');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deactivated_${Date.now()}_${user.email}`,
        firstName: null,
        lastName: null,
        phone: null,
      },
    });
  }

  async changeUserRole(userId: string, newRole: UserRole): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
      },
    });
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        osbb: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users;
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
      where: { status: ReportStatus.REJECTED },
    });
    return { total, open, closed, rejected };
  }
}