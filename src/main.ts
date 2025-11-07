// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cors from 'cors'; // Використовуйте 'import * as cors'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 1. ВСТАНОВЛЮЄМО ГЛОБАЛЬНИЙ ПРЕФІКС
  // Це виправлення №1. Тепер NestJS очікує /api/reports, /api/categories і т.д.
  app.setGlobalPrefix('api');

  // 2. НАЛАШТОВУЄМО CORS
  // (Я взяв це з вашого закоментованого коду)
  const corsOptions = {
    origin: ['http://localhost:3000'], // Ваш фронтенд
    credentials: true,
  };
  app.enableCors(corsOptions); // Цього методу достатньо

  // 3. ЗАПУСКАЄМО СЕРВЕР
  await app.listen(3001);
  logger.log('🟢 Додаток запущено на http://localhost:3001 (з префіксом /api)');
}
bootstrap();