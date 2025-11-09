import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('Recipients e2e', () => {
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

  it('GET /api/recipients -> 200 + список', async () => {
    prisma.recipient.findMany.mockResolvedValue([
      { id: 'r1', name: 'Міськсвітло' },
      { id: 'r2', name: 'Дорсервіс' },
    ] as any);

    const res = await request(app.getHttpServer())
      .get('/api/recipients')
      .expect(200);

    expect(res.body).toHaveLength(2);
  });
});
