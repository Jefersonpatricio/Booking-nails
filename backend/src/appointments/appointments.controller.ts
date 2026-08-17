import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { SalonsService } from '../salons/salons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentSalon } from '../auth/decorators/current-salon.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly salonsService: SalonsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentSalon() salonId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.appointmentsService.findAll(salonId, from, to);
  }

  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    const salonId = await this.salonsService.findIdBySlugOrThrow(dto.salonSlug);
    return this.appointmentsService.create(salonId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentSalon() salonId: string, @Param('id') id: string) {
    return this.appointmentsService.remove(salonId, id);
  }
}
