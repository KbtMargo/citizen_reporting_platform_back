import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
export class CreateOsbbDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;
}