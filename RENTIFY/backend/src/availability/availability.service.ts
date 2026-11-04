import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Propiedad } from '../persistence/entities';
import { dates } from '../common/domain';
import { IDisponibilidad, IActualizarReserva } from '../common/ports';
export async function lockProperty(tx: EntityManager, id: number) {
  await tx.query('SELECT pg_advisory_xact_lock(71001,$1)', [id]);
}
export async function expireProperty(tx: EntityManager, id: number) {
  await tx.query(
    "UPDATE reservas r SET estado='VENCIDA' WHERE propiedad_id=$1 AND estado='TEMPORAL' AND fecha_vencimiento_temporal<=now() AND NOT EXISTS(SELECT 1 FROM pagos p WHERE p.reserva_id=r.id AND p.estado='APROBADO')",
    [id],
  );
}
export async function assertAvailable(
  tx: EntityManager,
  id: number,
  from: string,
  to: string,
  excludeBlock = 0,
) {
  const [r] = await tx.query(
    `SELECT EXISTS(SELECT 1 FROM reservas WHERE propiedad_id=$1 AND (estado='CONFIRMADA' OR (estado='TEMPORAL' AND fecha_vencimiento_temporal>now())) AND fecha_desde<$3::date AND fecha_hasta>$2::date) OR EXISTS(SELECT 1 FROM periodos_bloqueados WHERE propiedad_id=$1 AND id<>$4 AND fecha_desde<$3::date AND fecha_hasta>$2::date) AS occupied`,
    [id, from, to, excludeBlock],
  );
  if (r.occupied)
    throw new ConflictException('La propiedad no está disponible en las fechas seleccionadas.');
}
@Injectable()
export class AvailabilityService implements IDisponibilidad, IActualizarReserva {
  constructor(private db: DataSource) {}
  async check(id: number, from: string, to: string) {
    dates(from, to);
    if (!(await this.db.getRepository(Propiedad).existsBy({ id, estado: 'ACTIVA' })))
      throw new NotFoundException('Propiedad no encontrada.');
    const intervals = await this.db.query(
      `SELECT fecha_desde,fecha_hasta,'RESERVADA' AS tipo FROM reservas WHERE propiedad_id=$1 AND (estado='CONFIRMADA' OR (estado='TEMPORAL' AND fecha_vencimiento_temporal>now())) AND fecha_desde<$3::date AND fecha_hasta>$2::date UNION ALL SELECT fecha_desde,fecha_hasta,'BLOQUEADA' FROM periodos_bloqueados WHERE propiedad_id=$1 AND fecha_desde<$3::date AND fecha_hasta>$2::date ORDER BY fecha_desde`,
      [id, from, to],
    );
    return { disponible: intervals.length === 0, periodos: intervals };
  }
  async expire() {
    const ids = await this.db.query(
      "SELECT DISTINCT propiedad_id FROM reservas WHERE estado='TEMPORAL' AND fecha_vencimiento_temporal<=now()",
    );
    for (const { propiedad_id } of ids)
      await this.db.transaction(async (tx) => {
        await lockProperty(tx, propiedad_id);
        await expireProperty(tx, propiedad_id);
      });
  }
}
