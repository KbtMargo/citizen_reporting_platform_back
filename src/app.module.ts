import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module'; 
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { RecipientsModule } from './recipients/recipients.module';
import { AdminModule } from './admin/admin.module';
import { OsbbModule } from './osbb/osbb.module';


@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
    }),
    PrismaModule, ReportsModule, NotificationsModule, AuthModule, UsersModule, CategoriesModule, RecipientsModule, AdminModule, OsbbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
