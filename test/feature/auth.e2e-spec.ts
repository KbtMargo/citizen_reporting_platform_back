import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

describe('Auth e2e', () => {
  let app: INestApplication;
  const prisma = mockDeep<PrismaService>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login -> 401 коли користувача нема', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'none@a', password: 'p' })
      .expect(401);
  });

  it('POST /api/auth/login -> 200 з валідним паролем', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@a',
      password: await bcrypt.hash('p', 4),
      role: 'RESIDENT',
      osbbId: null,
    } as any);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'a@a', password: 'p' })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
  });
});
