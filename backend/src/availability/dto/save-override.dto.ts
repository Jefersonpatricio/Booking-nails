import { IsBoolean, IsDateString, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class SaveOverrideDto {
  @IsDateString()
  date: string;

  @IsBoolean()
  isOpen: boolean;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:mm format' })
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  intervalMin?: number;
}
