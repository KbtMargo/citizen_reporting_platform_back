import { Controller, Get, UseGuards, Request, Patch, Param, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {
    this.logger.log('🟢 NotificationsController ініціалізовано');
  }

  @UseGuards(AuthGuard)
  @Get('my')
  findMyNotifications(@Request() req) {
    this.logger.log('🟡 [CONTROLLER] GET /api/notifications/my');
    const userId = req.user.sub;
    return this.notificationsService.findAllForUser(userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    this.logger.log(`🟡 [CONTROLLER] PATCH /api/notifications/${id}/read`);
    return this.notificationsService.markAsRead(id);
  }

  @UseGuards(AuthGuard)
  @Patch('read-all')
  markAllAsRead(@Request() req) {
    const userId = req.user.sub;
    this.logger.log('🟡 [CONTROLLER] PATCH /api/notifications/read-all');
    return this.notificationsService.markAllAsRead(userId);
  }
}