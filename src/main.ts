// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Додамо логування зареєстрованих модулів
  logger.log('🟢 Запуск додатку...');
  logger.log('🟢 Зареєстровані модулі: NotificationsModule, ReportsModule, AuthModule, etc.');
  
  await app.listen(3001);
  logger.log('🟢 Додаток запущено на http://localhost:3001');
}
bootstrap();

// src/main.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import cors from 'cors';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.setGlobalPrefix('api');

//   const corsOptions = {
//     origin: ['http://localhost:3000'],
//     credentials: true,
//     methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
//     allowedHeaders: [
//       'Content-Type',
//       'Authorization',
//       'X-Requested-With',
//       'Accept',
//       'Origin',
//     ],
//     exposedHeaders: ['Content-Length'],
//   };

//   app.use(cors(corsOptions));
//   app.options('*', cors(corsOptions)); // відповідаємо на всі preflight
//   // (enableCors можна не дублювати; якщо хочеш — не зашкодить)
//   app.enableCors(corsOptions);

//   await app.listen(3001);
// }
// bootstrap();
