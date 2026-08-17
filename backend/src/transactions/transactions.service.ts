import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(salonId: string, query: GetTransactionsDto) {
    const where: Prisma.TransactionWhereInput = { salonId };
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    if (query.type) where.type = query.type;

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  create(salonId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        type: dto.type,
        description: dto.description,
        amountCents: dto.amountCents,
        date: new Date(dto.date),
        salonId,
      },
    });
  }

  async remove(salonId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({ where: { id, salonId } });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    await this.prisma.transaction.delete({ where: { id } });
  }
}
