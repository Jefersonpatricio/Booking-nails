import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SalonsService } from './salons.service';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentSalon } from '../auth/decorators/current-salon.decorator';
import { StorageService } from '../storage/storage.service';

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

function toPublicSalon(salon: { id: string; name: string; slug: string; logoUrl: string | null; whatsappNumber: string | null }) {
  return {
    id: salon.id,
    name: salon.name,
    slug: salon.slug,
    logoUrl: salon.logoUrl,
    whatsappNumber: salon.whatsappNumber,
  };
}

@Controller('salons')
export class SalonsController {
  constructor(
    private readonly salonsService: SalonsService,
    private readonly storageService: StorageService,
  ) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const salon = await this.salonsService.findBySlug(slug);
    return toPublicSalon(salon);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentSalon() salonId: string, @Body() dto: UpdateSalonDto) {
    const salon = await this.salonsService.update(salonId, dto);
    return toPublicSalon(salon);
  }

  @Post('me/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_LOGO_SIZE_BYTES } }))
  async uploadLogo(@CurrentSalon() salonId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Envie um arquivo de imagem.');
    }
    if (!ALLOWED_LOGO_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Formato de imagem não suportado. Use PNG, JPG, WEBP ou SVG.');
    }

    const logoUrl = await this.storageService.uploadSalonLogo(salonId, file);
    const salon = await this.salonsService.updateLogo(salonId, logoUrl);
    return toPublicSalon(salon);
  }
}
