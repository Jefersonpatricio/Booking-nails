import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class GetSlotsDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  salonSlug: string;
}
