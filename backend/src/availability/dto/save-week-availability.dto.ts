import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsInt, Matches, Max, Min, ValidateNested } from 'class-validator';

export class WorkingHoursDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @IsBoolean()
  isOpen: boolean;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @IsInt()
  @Min(5)
  @Max(240)
  intervalMin: number;
}

export class SaveWeekAvailabilityDto {
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDayDto)
  days: WorkingHoursDayDto[];
}
