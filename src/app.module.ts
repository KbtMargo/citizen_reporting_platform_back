import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module'; 
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { RecipientsModule } from './recipients/recipients.module';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [PrismaModule, ReportsModule, NotificationsModule, AuthModule, UsersModule, CategoriesModule, RecipientsModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
