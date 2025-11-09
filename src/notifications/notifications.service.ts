import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId }
      });

      if (!user) {
        return null;
      }

      const newNotification = await this.prisma.notification.create({
        data: {
          title: dto.title,
          message: dto.message,
          userId: dto.userId,
          reportId: dto.reportId,
          isRead: false, 
        },
        include: {
          report: {
            select: { id: true, title: true }
          }
        }
      });


      this.notificationsGateway.sendNotificationToUser(
        dto.userId,
        newNotification,
      );

      return newNotification;
    } catch (error) {
      throw error; 
    }
  }

  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: {
        report: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new NotFoundException(`Сповіщення з ID ${notificationId} не знайдено`);
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
        include: {
          report: {
            select: { id: true, title: true }
          }
        }
      });

      return updatedNotification;
    } catch (error) {
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    
    try {
      const result = await this.prisma.notification.updateMany({
        where: { 
          userId: userId,
          isRead: false 
        },
        data: { isRead: true }
      });

      return { 
        success: true, 
        count: result.count,
        message: `Позначено ${result.count} сповіщень як прочитані`
      };
    } catch (error) {
      throw error;
    }
  }

async checkDatabaseConnection() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}
}