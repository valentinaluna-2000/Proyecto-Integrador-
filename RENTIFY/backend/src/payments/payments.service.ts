import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Decimal from 'decimal.js';
import { Actor, ReservaEstado, PagoEstado } from '../common/domain';
import { PaymentGateway, ILogicaPagos, IConfirmacionPago } from '../common/ports';
import { Pago, Reserva } from '../persistence/entities';
import { accessibleReservation } from '../reservations/reservations.service';
import { lockProperty, expireProperty } from '../availability/availability.service';
@Injectable()
export class PaymentsService implements ILogicaPagos, IConfirmacionPago {
  constructor(
    private db: DataSource,
    private gateway: PaymentGateway,
  ) {}
  async checkout(id: number, actor: Actor) {
    const { r, p } = await accessibleReservation(this.db.manager, id, actor);
    if (r.estado !== ReservaEstado.TEMPORAL || r.fecha_vencimiento_temporal.getTime() <= Date.now())
      throw new BadRequestException('La reserva no está vigente para pagar.');
    return { url: await this.gateway.checkout(id, r.importe_sena, p.nombre) };
  }
  async webhook(id: string, signature: string, requestId: string) {
    this.gateway.verifySignature(id, signature, requestId);
    const external = await this.gateway.payment(id);
    if (
      external.live_mode !== false ||
      external.currency_id !== 'ARS' ||
      String(external.id) !== id ||
      !/^\d+$/.test(external.external_reference)
    )
      throw new BadRequestException(
        'El pago no corresponde al entorno TEST o a una reserva válida.',
      );
    const reserva = await this.db
      .getRepository(Reserva)
      .findOneBy({ id: Number(external.external_reference) });
    if (!reserva) throw new BadRequestException('Referencia desconocida.');
    if (!new Decimal(external.transaction_amount).eq(reserva.importe_sena))
      throw new BadRequestException('El monto del pago no coincide con la seña.');
    return this.db.transaction(async (tx) => {
      await lockProperty(tx, reserva.propiedad_id);
      await expireProperty(tx, reserva.propiedad_id);
      const r = await tx.getRepository(Reserva).findOneByOrFail({ id: reserva.id });
      const existing = await tx.getRepository(Pago).findOneBy({ id_transaccion_externa: id });
      if (existing?.estado === PagoEstado.APROBADO) return { received: true };
      const status =
        external.status === 'approved'
          ? PagoEstado.APROBADO
          : external.status === 'rejected'
            ? PagoEstado.RECHAZADO
            : ['cancelled', 'refunded', 'charged_back'].includes(external.status)
              ? PagoEstado.CANCELADO
              : PagoEstado.PENDIENTE;
      await tx.save(Pago, {
        ...(existing || {}),
        reserva_id: r.id,
        monto: r.importe_sena,
        fecha: new Date(),
        estado: status,
        id_transaccion_externa: id,
      });
      if (
        status === PagoEstado.APROBADO &&
        r.estado === ReservaEstado.TEMPORAL &&
        r.fecha_vencimiento_temporal.getTime() > Date.now()
      )
        await tx.update(Reserva, r.id, { estado: ReservaEstado.CONFIRMADA });
      // A late approved payment is retained for administrative reconciliation, never reopens dates.
      return { received: true };
    });
  }
  async list(actor: Actor) {
    return this.db.query(
      "SELECT pay.*,p.nombre AS propiedad_nombre,r.estado AS reserva_estado,(pay.estado='APROBADO' AND r.estado IN ('CANCELADA','VENCIDA')) AS requiere_revision FROM pagos pay JOIN reservas r ON r.id=pay.reserva_id JOIN propiedades p ON p.id=r.propiedad_id WHERE p.propietario_id=$1 ORDER BY pay.fecha DESC",
      [actor.propietario_id],
    );
  }
}
