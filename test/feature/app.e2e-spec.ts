// test/feature/app.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import { createPrismaMock } from './mocks';

describe('App e2e (smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prisma = createPrismaMock();

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

  it('GET /api/unknown -> 404', async () => {
    await request(app.getHttpServer()).get('/api/unknown').expect(404);
  });

  // якщо маєш /health — розкоментуй:
  // it('GET /api/health -> 200', async () => {
  //   await request(app.getHttpServer()).get('/api/health').expect(200);
  // });
});
