import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  reportId: string;
  type: string;
  priority: string;
}

export class Notification {}
export class UpdateNotificationDto {}