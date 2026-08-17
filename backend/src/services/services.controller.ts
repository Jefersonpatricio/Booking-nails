import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { SalonsService } from '../salons/salons.service';
import { SalonSlugQueryDto } from '../salons/dto/salon-slug-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentSalon } from '../auth/decorators/current-salon.decorator';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly salonsService: SalonsService,
  ) {}

  @Get()
  async findAll(@Query() query: SalonSlugQueryDto) {
    const salonId = await this.salonsService.findIdBySlugOrThrow(query.salonSlug);
    return this.servicesService.findAll(salonId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentSalon() salonId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(salonId, dto);
  }
}
