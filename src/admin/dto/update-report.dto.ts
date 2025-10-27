import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ReportStatus, ReportPriority } from '@prisma/client'; 

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
  
  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filesToDelete?: string[];
}