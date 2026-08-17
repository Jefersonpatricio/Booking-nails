import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkingHoursDayDto } from './dto/save-week-availability.dto';
import { SaveOverrideDto } from './dto/save-override.dto';

function defaultDay(weekday: number): WorkingHoursDayDto {
  return { weekday, isOpen: false, startTime: '09:00', endTime: '18:00', intervalMin: 60 };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateTimes(startTime: string, endTime: string, intervalMin: number): string[] {
  const times: string[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  for (let min = startMin; min + intervalMin <= endMin; min += intervalMin) {
    times.push(minutesToTime(min));
  }
  return times;
}

type EffectiveDay = {
  isOpen: boolean;
  startTime: string;
  endTime: string;
  intervalMin: number;
  isOverride: boolean;
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeek(salonId: string): Promise<WorkingHoursDayDto[]> {
    const rows = await this.prisma.workingHours.findMany({ where: { salonId } });
    const byWeekday = new Map(rows.map((r) => [r.weekday, r]));
    return Array.from({ length: 7 }, (_, weekday) => byWeekday.get(weekday) ?? defaultDay(weekday));
  }

  async saveWeek(salonId: string, days: WorkingHoursDayDto[]): Promise<WorkingHoursDayDto[]> {
    await this.prisma.$transaction(
      days.map((day) =>
        this.prisma.workingHours.upsert({
          where: { salonId_weekday: { salonId, weekday: day.weekday } },
          update: day,
          create: { ...day, salonId },
        }),
      ),
    );
    return this.getWeek(salonId);
  }

  private async getEffectiveDay(salonId: string, dateStr: string): Promise<EffectiveDay> {
    const override = await this.prisma.availabilityOverride.findUnique({
      where: { salonId_date: { salonId, date: dateStr } },
    });
    if (override) {
      return {
        isOpen: override.isOpen,
        startTime: override.startTime ?? '09:00',
        endTime: override.endTime ?? '18:00',
        intervalMin: override.intervalMin ?? 60,
        isOverride: true,
      };
    }

    const weekday = new Date(`${dateStr}T00:00:00`).getDay();
    const row = await this.prisma.workingHours.findUnique({ where: { salonId_weekday: { salonId, weekday } } });
    const day = row ?? defaultDay(weekday);
    return { ...day, isOverride: false };
  }

  async getSlotsForDate(salonId: string, dateStr: string) {
    const day = await this.getEffectiveDay(salonId, dateStr);
    if (!day.isOpen) return [];

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    const bookedRows = await this.prisma.appointment.findMany({
      where: { salonId, date: { gte: startOfDay, lte: endOfDay } },
      select: { time: true },
    });
    const bookedTimes = new Set(bookedRows.map((r) => r.time));

    return generateTimes(day.startTime, day.endTime, day.intervalMin).map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }));
  }

  async getMonth(salonId: string, year: number, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dateStrs = Array.from(
      { length: daysInMonth },
      (_, i) => `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
    );

    const [workingHours, overrides] = await Promise.all([
      this.prisma.workingHours.findMany({ where: { salonId } }),
      this.prisma.availabilityOverride.findMany({ where: { salonId, date: { in: dateStrs } } }),
    ]);
    const byWeekday = new Map(workingHours.map((r) => [r.weekday, r]));
    const byDate = new Map(overrides.map((o) => [o.date, o]));

    return dateStrs.map((dateStr) => {
      const override = byDate.get(dateStr);
      if (override) {
        return {
          date: dateStr,
          isOpen: override.isOpen,
          startTime: override.startTime,
          endTime: override.endTime,
          intervalMin: override.intervalMin,
          isOverride: true,
        };
      }
      const weekday = new Date(`${dateStr}T00:00:00`).getDay();
      const day = byWeekday.get(weekday) ?? defaultDay(weekday);
      return { date: dateStr, ...day, isOverride: false };
    });
  }

  async saveOverride(salonId: string, dto: SaveOverrideDto) {
    if (dto.isOpen && (!dto.startTime || !dto.endTime || !dto.intervalMin)) {
      throw new BadRequestException('startTime, endTime and intervalMin are required when isOpen is true');
    }
    return this.prisma.availabilityOverride.upsert({
      where: { salonId_date: { salonId, date: dto.date } },
      update: {
        isOpen: dto.isOpen,
        startTime: dto.isOpen ? dto.startTime : null,
        endTime: dto.isOpen ? dto.endTime : null,
        intervalMin: dto.isOpen ? dto.intervalMin : null,
      },
      create: {
        date: dto.date,
        isOpen: dto.isOpen,
        startTime: dto.isOpen ? dto.startTime : null,
        endTime: dto.isOpen ? dto.endTime : null,
        intervalMin: dto.isOpen ? dto.intervalMin : null,
        salonId,
      },
    });
  }

  async deleteOverride(salonId: string, date: string) {
    await this.prisma.availabilityOverride.deleteMany({ where: { salonId, date } });
  }
}
