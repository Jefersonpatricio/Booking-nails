import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(salonId: string, from?: string, to?: string) {
    const date: Prisma.DateTimeFilter = {};
    if (from) date.gte = new Date(from);
    if (to) date.lte = new Date(to);

    return this.prisma.appointment.findMany({
      where: { salonId, ...(from || to ? { date } : {}) },
      include: { service: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async create(salonId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({ where: { id: dto.serviceId, salonId } });
    if (!service) {
      throw new BadRequestException('Service not found');
    }

    return this.prisma.appointment.create({
      data: {
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        serviceId: dto.serviceId,
        date: new Date(dto.date),
        time: dto.time,
        salonId,
      },
      include: { service: true },
    });
  }

  async remove(salonId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, salonId } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    await this.prisma.appointment.delete({ where: { id } });
  }
}
