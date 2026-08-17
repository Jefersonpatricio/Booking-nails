import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSalonDto } from './dto/update-salon.dto';

@Injectable()
export class SalonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const salon = await this.prisma.salon.findUnique({ where: { slug } });
    if (!salon) {
      throw new NotFoundException('Salão não encontrado.');
    }
    return salon;
  }

  async findIdBySlugOrThrow(slug: string): Promise<string> {
    const salon = await this.findBySlug(slug);
    return salon.id;
  }

  update(salonId: string, dto: UpdateSalonDto) {
    return this.prisma.salon.update({
      where: { id: salonId },
      data: {
        name: dto.name,
        whatsappNumber: dto.whatsappNumber?.trim() || null,
      },
    });
  }

  updateLogo(salonId: string, logoUrl: string) {
    return this.prisma.salon.update({
      where: { id: salonId },
      data: { logoUrl },
    });
  }
}
