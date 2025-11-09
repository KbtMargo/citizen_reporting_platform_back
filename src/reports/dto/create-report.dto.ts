import { IsString, IsNotEmpty, IsOptional, IsDecimal, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @IsString() @IsNotEmpty() @MinLength(5) @MaxLength(100)
  title: string;

  @IsString() @IsOptional() @MaxLength(1000)
  description?: string;

  @IsOptional() 
  @IsDecimal({ decimal_digits: '6' })
  @Type(() => String)
  lat?: string;

  @IsOptional() 
  @IsDecimal({ decimal_digits: '6' })
  @Type(() => String)
  lng?: string;

  @IsOptional() 
  @IsString()
  @MinLength(10) 
  address?: string;

  @IsString() @IsNotEmpty()
  categoryId: string;

  @IsString() @IsNotEmpty()
  recipientId: string;
}