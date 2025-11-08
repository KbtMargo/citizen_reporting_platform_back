import { IsOptional, IsString, IsEnum, IsPhoneNumber, ValidateIf, IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserAdminDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsPhoneNumber('UA') phone?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;

  @ValidateIf(o => o.osbbId !== null && o.osbbId !== undefined)
  @IsString()
  osbbId?: string | null;
}
