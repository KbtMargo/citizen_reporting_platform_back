import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
// 1. Імпортуйте ваш справжній Guard автентифікації
// (Шлях може бути іншим, наприклад, 'src/auth/guards/jwt-auth.guard')
import { AuthGuard } from 'src/auth/auth.guard';
import { mockDeep } from 'jest-mock-extended';

// Ваш AllowGuard ідеально підходить для заміни
class AllowGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    // Встановлюємо req.user, щоб контролери, які використовують @Req(), працювали
    req.user = { 
      sub: 'u1', 
      email: 'e@e.com', 
      role: 'RESIDENT' 
    };
    return true;
  }
}

describe('Notifications e2e', () => {
  let app: INestApplication;
  const prisma = mockDeep<PrismaService>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // мок БД
      .overrideProvider(PrismaService)
      .useValue(prisma)
      // КЛЮЧ: Повністю замінюємо справжній JwtAuthGuard на наш AllowGuard
      // <--- ЗМІНА 1: Замініть 'AuthService' на 'overrideGuard'
      .overrideGuard(AuthGuard) // <-- ВАЖЛИВО: Переконайтеся, що це ваш справжній guard
      .useClass(AllowGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    
    // <--- ЗМІНА 2: app.useGlobalGuards(new AllowGuard()) більше не потрібен
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    // Очищуємо моки між тестами
    jest.clearAllMocks();
  });

  it('GET /api/notifications/my -> 200 []', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    
    await request(app.getHttpServer())
      // <--- ЗМІНА 3: Видалено подвійний /api
      .get('/api/notifications/my') 
      .set('Authorization', 'Bearer token') // 'Bearer token' тепер ігнорується
      .expect(200)
      .expect([]);
      
    // Перевірка, що guard правильно передав user ID
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' }, // 'u1' з нашого AllowGuard
      }),
    );
  });

  it.skip('POST /api/notifications -> 201', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
    prisma.notification.create.mockResolvedValue({
      id: 'n1', title: 'Hi', message: 'Msg', userId: 'u1', reportId: null, isRead: false, report: null,
    } as any);

    const dto = { title: 'Hi', message: 'Msg', userId: 'u1' };

    const res = await request(app.getHttpServer())
      // <--- ЗМІНА 4: Видалено подвійний /api
      .post('/api/notifications')
      .set('Authorization', 'Bearer token')
      .send(dto)
      .expect(201);

    expect(res.body.id).toBe('n1');
  });

  it('PATCH /api/notifications/:id/read -> 404 якщо не існує', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      // <--- ЗМІНА 5: Видалено подвійний /api
      .patch('/api/notifications/n404/read')
      .set('Authorization', 'Bearer token')
      .expect(404);
  });

  it('PATCH /api/notifications/:id/read -> 200 коли існує', async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: 'n1', isRead: false, userId: 'u1' } as any); // <--- Додано userId
    prisma.notification.update.mockResolvedValue({ id: 'n1', isRead: true } as any);

    const res = await request(app.getHttpServer())
      // <--- ЗМІНА 6: Видалено подвійний /api
      .patch('/api/notifications/n1/read')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(res.body.isRead).toBe(true);
  });
});