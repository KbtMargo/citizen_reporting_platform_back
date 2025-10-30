// src/notifications/dto/create-notification.dto.ts
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string; // <-- ДОДАНО

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  reportId: string;
}

// (Інші класи, якщо вони тут є, залишаються)
export class Notification {}
export class UpdateNotificationDto {}