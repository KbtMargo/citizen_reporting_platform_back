import { NotificationsService } from 'src/notifications/notifications.service';
import { createPrismaMock, PrismaMock } from '../mocks';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService (unit)', () => {
  let service: NotificationsService;
  let prisma: PrismaMock;
  const gateway = { sendNotificationToUser: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    // @ts-ignore: конструктор (prisma, notificationsGateway)
    service = new NotificationsService(prisma, gateway);
  });

  describe('create', () => {
    const dto = {
      title: 'Новина',
      message: 'Тестове повідомлення',
      userId: 'u1',
      reportId: 'rep1',
    };

   it('створює сповіщення і делегує в gateway', async () => {
  prisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
  const created = {
    id: 'n1',
    ...dto,
    isRead: false,
    report: { id: 'rep1', title: 'Репорт' },
  };
  prisma.notification.create.mockResolvedValue(created as any);

  const res = await service.create(dto as any);

  expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  expect(prisma.notification.create).toHaveBeenCalledWith({
    data: {
      title: dto.title,
      message: dto.message,
      userId: dto.userId,
      reportId: dto.reportId,
      isRead: false,
    },
    include: { report: { select: { id: true, title: true } } },
  });
  expect(gateway.sendNotificationToUser).toHaveBeenCalledWith('u1', created);

  // 🔽 головне: прибираємо TS18047
  expect(res).not.toBeNull();
  expect((res as any).id).toBe('n1'); // або: expect(res?.id).toBe('n1')
});


    it('повертає null і не дзвонить gateway, якщо користувач не знайдений', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await service.create(dto as any);

      expect(res).toBeNull();
      expect(gateway.sendNotificationToUser).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('кидає 404 якщо сповіщення не існує', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('n404')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('оновлює isRead та повертає сповіщення', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', isRead: false } as any);
      prisma.notification.update.mockResolvedValue({
        id: 'n1',
        isRead: true,
        report: { id: 'rep1', title: 'Репорт' },
      } as any);

      const res = await service.markAsRead('n1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isRead: true },
        include: { report: { select: { id: true, title: true } } },
      });
      expect(res.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('повертає кількість оновлених записів', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 } as any);

      const res = await service.markAllAsRead('u1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isRead: false },
        data: { isRead: true },
      });
      expect(res).toEqual({
        success: true,
        count: 3,
        message: 'Позначено 3 сповіщень як прочитані',
      });
    });
  });

  describe('findAllForUser', () => {
    it('повертає всі сповіщення користувача з report{id,title}', async () => {
      prisma.notification.findMany.mockResolvedValue([
        { id: 'n1', userId: 'u1', report: { id: 'rep1', title: 'R1' } },
      ] as any);

      const res = await service.findAllForUser('u1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: { report: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(res[0].id).toBe('n1');
    });
  });
});
