import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedPeriodsService } from './blocked-periods.service';
import { BlockedPeriodsController } from './blocked-periods.controller';
import { BlockedPeriod } from './entities/blocked-period.entity';
import { Property } from '../properties/entities/property.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedPeriod, Property, Reservation])],
  controllers: [BlockedPeriodsController],
  providers: [BlockedPeriodsService],
})
export class BlockedPeriodsModule {}
