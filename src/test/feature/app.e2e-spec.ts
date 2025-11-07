import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import request from 'supertest';

describe('App e2e', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });
  afterAll(async () => app.close());

  it('GET /api/health (якщо є) або 404 на невідомий роут', async () => {
    const res = await request(app.getHttpServer()).get('/api/unknown');
    expect([404,200]).toContain(res.status);
  });
});
