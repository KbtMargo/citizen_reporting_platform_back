// src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
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

  // ... (Ваш метод findAllForUser залишається без змін) ...
  async findAllForUser(userId: string) {
    // ...
  }

  async create(dto: CreateNotificationDto) {
    this.logger.log(`[SERVICE] Створюємо сповіщення для ${dto.userId}`);
    try {
      const newNotification = await this.prisma.notification.create({
        data: {
          title: dto.title, // <-- ДОДАНО
          message: dto.message,
          userId: dto.userId,
          reportId: dto.reportId,
        },
        include: { // Включаємо report, щоб надіслати повні дані на фронтенд
          report: {
            select: { id: true, title: true }
          }
        }
      });

      this.notificationsGateway.sendNotificationToUser(
        dto.userId,
        newNotification, // Надсилаємо повний об'єкт
      );

      return newNotification;
    } catch (error) {
      this.logger.error(`[SERVICE] ПОМИЛКА СТВОРЕННЯ СПОВІЩЕННЯ:`, error);
    }
  }
}