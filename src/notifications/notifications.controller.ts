import { Controller, Get, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user/:userId')
  findAllForUser(@Param('userId') userId: string) {
    return this.notificationsService.findAllForUser(userId);
  }
}