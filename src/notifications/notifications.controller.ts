import { Controller, Get, UseGuards, Request, Patch, Param, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
export class NotificationsController {

  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(AuthGuard)
  @Get('my')
  findMyNotifications(@Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.findAllForUser(userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id);
  }

  @UseGuards(AuthGuard)
  @Patch('read-all')
  markAllAsRead(@Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }
}