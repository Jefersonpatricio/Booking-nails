import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { SalonsModule } from '../salons/salons.module';

@Module({
  imports: [SalonsModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
