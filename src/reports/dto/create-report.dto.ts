// src/reports/dto/create-report.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDecimal, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @IsString() @IsNotEmpty() @MinLength(5) @MaxLength(100)
  title: string;

  @IsString() @IsOptional() @MaxLength(1000)
  description?: string;

  // --- ЗМІНЕНО ---
  @IsOptional() // Тепер опціонально
  @IsDecimal({ decimal_digits: '6' })
  @Type(() => String)
  lat?: string;

  @IsOptional() // Тепер опціонально
  @IsDecimal({ decimal_digits: '6' })
  @Type(() => String)
  lng?: string;

  @IsOptional() // Тепер опціонально
  @IsString()
  @MinLength(10) // Додамо мінімальну довжину для адреси
  address?: string;
  // -------------

  @IsString() @IsNotEmpty()
  categoryId: string;

  @IsString() @IsNotEmpty()
  recipientId: string;
}