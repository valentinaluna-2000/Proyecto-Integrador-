import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Property } from '../properties/entities/property.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Cancellation } from '../cancellations/entities/cancellation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Property, Payment, Cancellation]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
