import { TransactionType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class GetTransactionsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
