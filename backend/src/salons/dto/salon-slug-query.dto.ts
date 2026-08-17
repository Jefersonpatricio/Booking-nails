import { IsNotEmpty, IsString } from 'class-validator';

export class SalonSlugQueryDto {
  @IsString()
  @IsNotEmpty()
  salonSlug: string;
}
