import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cors from 'cors'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const corsOptions = {
    origin: ['http://localhost:3000'],
    credentials: true,
  };
  app.enableCors(corsOptions); 

  await app.listen(3001);
}
bootstrap();