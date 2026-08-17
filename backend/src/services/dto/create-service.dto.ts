import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsInt()
  @Min(1)
  priceCents: number;

  @IsInt()
  @Min(1)
  durationMin: number;
}
