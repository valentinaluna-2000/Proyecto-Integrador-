import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Actor, Rol, ReservaEstado, PropiedadEstado, quote, validateStay } from '../common/domain';
import { ReserveDto } from '../common/dtos';
import { Reserva, Propiedad, Pago, Cancelacion } from '../persistence/entities';
import {
  lockProperty,
  expireProperty,
  assertAvailable,
} from '../availability/availability.service';
import { ILogicaReservas } from '../common/ports';
export async function accessibleReservation(tx: EntityManager, id: number, actor: Actor) {
  const r = await tx.getRepository(Reserva).findOneBy({ id });
  if (!r) throw new NotFoundException('Reserva no encontrada.');
  const p = await tx.getRepository(Propiedad).findOneByOrFail({ id: r.propiedad_id });
  if (
    actor.role === Rol.CLIENTE
      ? r.cliente_id !== actor.id
      : p.propietario_id !== actor.propietario_id
  )
    throw new ForbiddenException('No tenés acceso a esta reserva.');
  return { r, p };
}
@Injectable()
export class ReservationsService implements ILogicaReservas {
  constructor(private db: DataSource) {}
  async create(actor: Actor, data: ReserveDto) {
    if (actor.role !== Rol.CLIENTE)
      throw new ForbiddenException('Solo los clientes pueden reservar.');
    return this.db.transaction(async (tx) => {
      await lockProperty(tx, data.propiedad_id);
      const p = await tx
        .getRepository(Propiedad)
        .findOneBy({ id: data.propiedad_id, estado: PropiedadEstado.ACTIVA });
      if (!p) throw new BadRequestException('La propiedad no está activa.');
      validateStay(p, data.fecha_desde, data.fecha_hasta, data.cantidad_huespedes);
      await expireProperty(tx, p.id);
      await assertAvailable(tx, p.id, data.fecha_desde, data.fecha_hasta);
      const amounts = quote(data.fecha_desde, data.fecha_hasta, p.precio_noche, p.porcentaje_sena);
      return tx.save(Reserva, {
        ...data,
        cliente_id: actor.id,
        estado: ReservaEstado.TEMPORAL,
        fecha_creacion: new Date(),
        fecha_vencimiento_temporal: new Date(Date.now() + 90 * 60000),
        importe_total: amounts.importe_total,
        importe_sena: amounts.importe_sena,
      });
    });
  }
  async list(actor: Actor) {
    return this.db.query(
      `SELECT r.*,p.nombre AS propiedad_nombre,p.direccion FROM reservas r JOIN propiedades p ON p.id=r.propiedad_id WHERE ${actor.role === Rol.ADMINISTRADOR ? 'p.propietario_id' : 'r.cliente_id'}=$1 ORDER BY r.fecha_creacion DESC LIMIT 500`,
      [actor.role === Rol.ADMINISTRADOR ? actor.propietario_id : actor.id],
    );
  }
  async detail(id: number, actor: Actor) {
    const { r, p } = await accessibleReservation(this.db.manager, id, actor);
    return {
      ...r,
      propiedad: p,
      pagos: await this.db.getRepository(Pago).findBy({ reserva_id: id }),
      cancelacion: await this.db.getRepository(Cancelacion).findOneBy({ reserva_id: id }),
    };
  }
}
