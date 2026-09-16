import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Cliente } from '../users/entities/cliente.entity';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Reservation, Cliente]),
    ReservationsModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_PROVIDER, useClass: MercadoPagoProvider },
  ],
})
export class PaymentsModule {}
