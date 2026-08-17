import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentSalon } from '../auth/decorators/current-salon.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@CurrentSalon() salonId: string, @Query() query: GetTransactionsDto) {
    return this.transactionsService.findAll(salonId, query);
  }

  @Post()
  create(@CurrentSalon() salonId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(salonId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentSalon() salonId: string, @Param('id') id: string) {
    return this.transactionsService.remove(salonId, id);
  }
}
