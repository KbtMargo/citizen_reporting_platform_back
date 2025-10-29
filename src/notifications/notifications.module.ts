import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule
  ],
  controllers: [
    NotificationsController
  ],
  providers: [
    NotificationsService,
    NotificationsGateway 
  ],
  exports: [
    NotificationsGateway, 
    NotificationsService 
  ],
})
export class NotificationsModule {}