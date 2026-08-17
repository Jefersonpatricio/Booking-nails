import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(salonId: string) {
    return this.prisma.service.findMany({ where: { salonId }, orderBy: { createdAt: 'asc' } });
  }

  async create(salonId: string, dto: CreateServiceDto) {
    try {
      return await this.prisma.service.create({
        data: {
          name: dto.name,
          priceCents: dto.priceCents,
          durationMin: dto.durationMin,
          salonId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Já existe um serviço com esse nome.');
      }
      throw err;
    }
  }
}
