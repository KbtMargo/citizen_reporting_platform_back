// src/notifications/notifications.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    this.logger.log('🔵 [NOTIFICATIONS SERVICE] Створення сповіщення:', dto);
    
    try {
      // Перевіряємо, чи існує користувач
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId }
      });

      if (!user) {
        this.logger.log(`🟠 [NOTIFICATIONS SERVICE] Користувач не знайдений: ${dto.userId}`);
        return null;
      }

      const newNotification = await this.prisma.notification.create({
        data: {
          title: dto.title,
          message: dto.message,
          userId: dto.userId,
          reportId: dto.reportId,
          isRead: false, // За замовчуванням не прочитане
        },
        include: {
          report: {
            select: { id: true, title: true }
          }
        }
      });

      this.logger.log('🟢 [NOTIFICATIONS SERVICE] Співіщення створено в БД:', newNotification);

      // Відправляємо через WebSocket
      this.notificationsGateway.sendNotificationToUser(
        dto.userId,
        newNotification,
      );

      return newNotification;
    } catch (error) {
      this.logger.error('🔴 [NOTIFICATIONS SERVICE] Помилка створення сповіщення:', error);
      throw error; // Краще прокинути помилку далі
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
    this.logger.log(`🟡 [NOTIFICATIONS SERVICE] Позначаємо сповіщення як прочитане: ${notificationId}`);
    
    try {
      // Спочатку перевіримо, чи існує сповіщення
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

      this.logger.log('🟢 [NOTIFICATIONS SERVICE] Співіщення позначено як прочитане:', updatedNotification);
      return updatedNotification;
    } catch (error) {
      this.logger.error('🔴 [NOTIFICATIONS SERVICE] Помилка маркування сповіщення як прочитаного:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    this.logger.log(`🟡 [NOTIFICATIONS SERVICE] Позначаємо всі сповіщення як прочитані для: ${userId}`);
    
    try {
      const result = await this.prisma.notification.updateMany({
        where: { 
          userId: userId,
          isRead: false 
        },
        data: { isRead: true }
      });

      this.logger.log(`🟢 [NOTIFICATIONS SERVICE] Позначено ${result.count} сповіщень як прочитані`);
      return { 
        success: true, 
        count: result.count,
        message: `Позначено ${result.count} сповіщень як прочитані`
      };
    } catch (error) {
      this.logger.error('🔴 [NOTIFICATIONS SERVICE] Помилка маркування всіх сповіщень:', error);
      throw error;
    }
  }

  // Додайте до notifications.service.ts
async checkDatabaseConnection() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    this.logger.log('🟢 Підключення до бази даних успішне');
    return true;
  } catch (error) {
    this.logger.error('🔴 Помилка підключення до бази даних:', error);
    return false;
  }
}
}