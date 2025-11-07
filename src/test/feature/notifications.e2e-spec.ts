import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AuthService } from 'src/auth/auth.service';

describe('Notifications feature', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NotificationsModule],
    })
      .overrideProvider(AuthService)
      .useValue({ verifyToken: jest.fn().mockResolvedValue({ sub: 'u1' }) })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/notifications/my -> 200 [] (порожній список для прикладу)', async () => {
    await request(app.getHttpServer())
      .get('/api/notifications/my')
      .set('Authorization', 'Bearer testtoken')
      .expect(200);
  });
});
