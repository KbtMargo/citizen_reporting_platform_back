// src/reports/dto/create-report.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDecimal, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer'; // Для перетворення типів

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  // Приймаємо координати як рядки і перетворюємо їх на числа
  @IsDecimal({ decimal_digits: '6' }) // Дозволяємо до 6 знаків після коми
  @Type(() => String) // Важливо для перетворення
  lat: string;

  @IsDecimal({ decimal_digits: '6' })
  @Type(() => String)
  lng: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string; // ID категорії

  @IsString()
  @IsNotEmpty()
  recipientId: string; // ID отримувача
}