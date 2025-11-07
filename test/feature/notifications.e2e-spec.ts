import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { mockDeep } from 'jest-mock-extended';

class AllowGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
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
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideGuard(AuthGuard) 
      .useClass(AllowGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/notifications/my -> 200 []', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    
    await request(app.getHttpServer())
      .get('/api/notifications/my') 
      .set('Authorization', 'Bearer token')
      .expect(200)
      .expect([]);
      
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' }, 
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
      .post('/api/notifications')
      .set('Authorization', 'Bearer token')
      .send(dto)
      .expect(201);

    expect(res.body.id).toBe('n1');
  });

  it('PATCH /api/notifications/:id/read -> 404 якщо не існує', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .patch('/api/notifications/n404/read')
      .set('Authorization', 'Bearer token')
      .expect(404);
  });

  it('PATCH /api/notifications/:id/read -> 200 коли існує', async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: 'n1', isRead: false, userId: 'u1' } as any); 
    prisma.notification.update.mockResolvedValue({ id: 'n1', isRead: true } as any);

    const res = await request(app.getHttpServer())
      .patch('/api/notifications/n1/read')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(res.body.isRead).toBe(true);
  });
});