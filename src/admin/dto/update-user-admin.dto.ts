import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserAdminDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsUUID() osbbId?: string | null;
}