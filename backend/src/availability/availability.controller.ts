import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { SaveWeekAvailabilityDto } from './dto/save-week-availability.dto';
import { GetSlotsDto } from './dto/get-slots.dto';
import { GetMonthDto } from './dto/get-month.dto';
import { SaveOverrideDto } from './dto/save-override.dto';
import { SalonsService } from '../salons/salons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentSalon } from '../auth/decorators/current-salon.decorator';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly salonsService: SalonsService,
  ) {}

  @Get('week')
  @UseGuards(JwtAuthGuard)
  getWeek(@CurrentSalon() salonId: string) {
    return this.availabilityService.getWeek(salonId);
  }

  @Put('week')
  @UseGuards(JwtAuthGuard)
  saveWeek(@CurrentSalon() salonId: string, @Body() dto: SaveWeekAvailabilityDto) {
    return this.availabilityService.saveWeek(salonId, dto.days);
  }

  @Get('slots')
  async getSlotsForDate(@Query() query: GetSlotsDto) {
    const salonId = await this.salonsService.findIdBySlugOrThrow(query.salonSlug);
    return this.availabilityService.getSlotsForDate(salonId, query.date);
  }

  @Get('month')
  @UseGuards(JwtAuthGuard)
  getMonth(@CurrentSalon() salonId: string, @Query() query: GetMonthDto) {
    return this.availabilityService.getMonth(salonId, query.year, query.month);
  }

  @Put('override')
  @UseGuards(JwtAuthGuard)
  saveOverride(@CurrentSalon() salonId: string, @Body() dto: SaveOverrideDto) {
    return this.availabilityService.saveOverride(salonId, dto);
  }

  @Delete('override/:date')
  @UseGuards(JwtAuthGuard)
  deleteOverride(@CurrentSalon() salonId: string, @Param('date') date: string) {
    return this.availabilityService.deleteOverride(salonId, date);
  }
}
