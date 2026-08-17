import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSalonDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}
