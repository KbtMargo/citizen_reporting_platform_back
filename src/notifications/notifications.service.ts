import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    console.log(`КРОК А: [БЕКЕНД] Отримав запит для користувача з ID: ${userId}`);
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          report: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      console.log(`КРОК Б: [БЕКЕНД] Успішно знайшов ${notifications.length} сповіщень в базі.`);
      return notifications;
    } catch (error) {
      console.error("КРОК В: [БЕКЕНД] ПОМИЛКА ПРИ РОБОТІ З БАЗОЮ ДАНИХ:", error);
      throw error;
    }
  }
}