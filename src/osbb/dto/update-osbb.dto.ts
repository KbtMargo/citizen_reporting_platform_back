import { IsString, IsOptional } from 'class-validator';
export class UpdateOsbbDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;
}