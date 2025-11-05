import { Module, Logger } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {
  private readonly logger = new Logger(NotificationsModule.name);

  constructor() {
    this.logger.log('🟢 NotificationsModule завантажено');
  }
}