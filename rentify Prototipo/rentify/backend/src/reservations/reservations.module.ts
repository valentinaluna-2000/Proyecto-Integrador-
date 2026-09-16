import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsScheduler } from './reservations.scheduler';
import { Reservation } from './entities/reservation.entity';
import { Property } from '../properties/entities/property.entity';
import { BlockedPeriod } from '../blocked-periods/entities/blocked-period.entity';
import { Cliente } from '../users/entities/cliente.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Cancellation } from '../cancellations/entities/cancellation.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Property,
      BlockedPeriod,
      Cliente,
      Payment,
      Cancellation,
    ]),
    MailModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}
