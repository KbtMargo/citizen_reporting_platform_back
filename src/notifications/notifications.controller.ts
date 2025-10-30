// src/notifications/notifications.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(AuthGuard) // <-- ВИПРАВЛЕНО: Замінено 'new AuthGuard('jwt')'
  @Get('my')
  findMyNotifications(@Request() req) {
    // req.user.sub - це ID з вашого JWT токену
    const userId = req.user.sub;
    // Викликаємо сервіс з ID поточного користувача
    return this.notificationsService.findAllForUser(userId);
  }
}