import { TransactionType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @MinLength(1)
  description: string;

  @IsInt()
  @Min(1)
  amountCents: number;

  @IsDateString()
  date: string;
}
