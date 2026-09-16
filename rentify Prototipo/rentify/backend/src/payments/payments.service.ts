import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { Cliente } from '../users/entities/cliente.entity';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from './providers/payment-provider.interface';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ReservationsService } from '../reservations/reservations.service';
import { MercadoPagoWebhookDto } from './dto/webhook.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Reservation) private reservationRepo: Repository<Reservation>,
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
    @Inject(PAYMENT_PROVIDER) private provider: PaymentProvider,
    private configService: ConfigService,
    private reservationsService: ReservationsService,
  ) {}

  async createPaymentPreference(reservationId: number, user: JwtPayload) {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
      relations: ['property'],
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada.');
    if (reservation.clienteId !== user.sub) {
      throw new BadRequestException('Esta reserva no pertenece al usuario actual.');
    }
    if (reservation.estado !== ReservationStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Solo se puede generar el pago de una reserva pendiente de pago.',
      );
    }
    if (
      reservation.fechaVencimientoTemporal &&
      reservation.fechaVencimientoTemporal.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'El plazo para pagar la sena de esta reserva ya vencio.',
      );
    }

    const cliente = await this.clienteRepo.findOne({ where: { id: user.sub } });
    const backendUrl = this.configService.get<string>('BACKEND_URL');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const { preferenceId, initPoint } = await this.provider.createPreference({
      reservationId: reservation.id,
      title: `Sena - Reserva #${reservation.id} - ${reservation.property.nombre}`,
      amount: Number(reservation.importeSena),
      payerEmail: cliente?.email || 'test_user@test.com',
      successUrl: `${frontendUrl}/reservas/pago-resultado?reservationId=${reservation.id}&status=success`,
      failureUrl: `${frontendUrl}/reservas/pago-resultado?reservationId=${reservation.id}&status=failure`,
      pendingUrl: `${frontendUrl}/reservas/pago-resultado?reservationId=${reservation.id}&status=pending`,
      notificationUrl: `${backendUrl}/api/payments/webhook`,
    });

    let payment = await this.paymentRepo.findOne({
      where: { reservationId: reservation.id },
    });
    if (!payment) {
      payment = this.paymentRepo.create({ reservationId: reservation.id });
    }
    payment.provider = 'mercadopago';
    payment.externalPreferenceId = preferenceId;
    payment.monto = reservation.importeSena;
    payment.estado = PaymentStatus.PENDING;
    await this.paymentRepo.save(payment);

    return { initPoint, preferenceId };
  }

  /**
   * Procesa la notificacion (webhook) de Mercado Pago de forma idempotente:
   * si el pago ya fue registrado con ese externalPaymentId y su estado no
   * cambio, no vuelve a duplicar efectos (no reconfirma una reserva ya
   * confirmada, no duplica registros).
   */
  async handleWebhook(dto: MercadoPagoWebhookDto) {
    const paymentId = dto.data?.id || dto.id;
    const type = dto.type || dto.topic;

    if (!paymentId || (type && type !== 'payment')) {
      // Ignoramos notificaciones que no sean de pagos (ej: merchant_order).
      return { received: true };
    }

    const info = await this.provider.getPaymentInfo(paymentId);
    const reservationId = info.externalReference
      ? parseInt(info.externalReference, 10)
      : null;
    if (!reservationId) {
      this.logger.warn(`Webhook sin external_reference valido: ${paymentId}`);
      return { received: true };
    }

    let payment = await this.paymentRepo.findOne({ where: { reservationId } });
    if (!payment) {
      payment = this.paymentRepo.create({ reservationId, provider: 'mercadopago' });
    }

    const yaEstabaAprobado = payment.estado === PaymentStatus.APPROVED;

    payment.externalPaymentId = info.id;
    payment.monto = info.amount;
    payment.estado = this.mapStatus(info.status);
    payment.statusDetail = info.statusDetail;
    payment.rawPayload = info.raw;
    if (payment.estado === PaymentStatus.APPROVED && !payment.paidAt) {
      payment.paidAt = new Date();
    }
    await this.paymentRepo.save(payment);

    if (payment.estado === PaymentStatus.APPROVED && !yaEstabaAprobado) {
      await this.reservationsService.confirmAfterPayment(reservationId);
    }

    return { received: true };
  }

  private mapStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'rejected':
        return PaymentStatus.REJECTED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      case 'in_process':
      case 'in_mediation':
        return PaymentStatus.IN_PROCESS;
      default:
        return PaymentStatus.PENDING;
    }
  }

  async findAllAdmin(admin: JwtPayload) {
    return this.paymentRepo
      .createQueryBuilder('pay')
      .leftJoinAndSelect('pay.reservation', 'reservation')
      .leftJoinAndSelect('reservation.property', 'property')
      .leftJoinAndSelect('reservation.cliente', 'cliente')
      .where('property.propietarioId = :propietarioId', {
        propietarioId: admin.propietarioId,
      })
      .orderBy('pay.createdAt', 'DESC')
      .getMany();
  }

  async findForReservation(reservationId: number) {
    return this.paymentRepo.find({ where: { reservationId } });
  }
}
