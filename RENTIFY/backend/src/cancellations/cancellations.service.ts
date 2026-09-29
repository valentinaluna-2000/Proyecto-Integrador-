import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Actor, Rol, ReservaEstado, PagoEstado, validateCancellation } from '../common/domain';
import { ILogicaCancelaciones } from '../common/ports';
import { CancelDto } from '../common/dtos';
import { Cancelacion, Reserva, Pago } from '../persistence/entities';
import { accessibleReservation } from '../reservations/reservations.service';
import { lockProperty, expireProperty } from '../availability/availability.service';
@Injectable()
export class CancellationsService implements ILogicaCancelaciones {
  constructor(private db: DataSource) {}
  async cancel(id: number, actor: Actor, data: CancelDto) {
    const initial = await accessibleReservation(this.db.manager, id, actor);
    return this.db.transaction(async (tx) => {
      await lockProperty(tx, initial.p.id);
      await expireProperty(tx, initial.p.id);
      const { r, p } = await accessibleReservation(tx, id, actor);
      if (r.estado === ReservaEstado.CANCELADA)
        return tx.getRepository(Cancelacion).findOneBy({ reserva_id: id });
      if (r.estado === ReservaEstado.VENCIDA)
        throw new BadRequestException('La reserva ya venció.');
      validateCancellation(r.fecha_desde, p.hora_checkin, !!data.es_excepcional, actor);
      const record = await tx.save(Cancelacion, {
        reserva_id: id,
        administrador_id: actor.role === Rol.ADMINISTRADOR ? actor.id : null,
        cliente_id: actor.role === Rol.CLIENTE ? actor.id : null,
        tipo_usuario: actor.role,
        fecha: new Date(),
        motivo: data.motivo,
        es_excepcional: !!data.es_excepcional,
        requiere_reintegro: await tx
          .getRepository(Pago)
          .existsBy({ reserva_id: id, estado: PagoEstado.APROBADO }),
      });
      await tx.update(Reserva, id, { estado: ReservaEstado.CANCELADA });
      return record;
    });
  }
  async list(actor: Actor) {
    return this.db.query(
      'SELECT c.*,p.nombre AS propiedad_nombre FROM cancelaciones c JOIN reservas r ON r.id=c.reserva_id JOIN propiedades p ON p.id=r.propiedad_id WHERE p.propietario_id=$1 ORDER BY c.fecha DESC',
      [actor.propietario_id],
    );
  }
}
