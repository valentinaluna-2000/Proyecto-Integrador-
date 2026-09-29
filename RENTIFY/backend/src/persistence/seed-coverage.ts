import { EntityManager } from 'typeorm';
import { DateTime } from 'luxon';
import { quote, ZONE } from '../common/domain';
import { Reserva, Pago, Cancelacion, Propiedad } from './entities';

// Stable payment references identify each extra fixture across dates and repeated runs.
// Existing demo reservations can satisfy a scenario without being rewritten.
export async function ensureDemoCoverage(tx: EntityManager, ownerId: number, clientId: number) {
  const now = DateTime.now().setZone(ZONE);
  const properties = await tx.getRepository(Propiedad).findBy({ propietario_id: ownerId });
  properties.sort((a, b) => a.id - b.id);
  const scenarios = [
    { key: 'PENDING', state: 'TEMPORAL', payment: 'PENDIENTE', offset: 30 },
    { key: 'EXPIRED', state: 'VENCIDA', payment: 'RECHAZADO', offset: 35 },
    { key: 'HISTORY', state: 'CONFIRMADA', payment: 'APROBADO', offset: -14 },
    { key: 'CLIENT-CANCEL', state: 'CANCELADA', payment: 'APROBADO', offset: 40 },
  ];
  for (const scenario of scenarios) {
    const reference = `DEMO-COVERAGE-${scenario.key}`;
    if (await tx.getRepository(Pago).existsBy({ id_transaccion_externa: reference })) continue;
    const candidates: Reserva[] = await tx.query(
      `SELECT r.* FROM reservas r JOIN propiedades p ON p.id=r.propiedad_id
       WHERE p.propietario_id=$1 AND r.cliente_id=$2 AND r.estado=$3 ORDER BY r.id`,
      [ownerId, clientId, scenario.state],
    );
    let reservation: Reserva | undefined;
    for (const candidate of candidates) {
      if (
        scenario.key === 'PENDING' &&
        (new Date(candidate.fecha_vencimiento_temporal).getTime() <= now.toMillis() ||
          candidate.fecha_desde <= now.toISODate()!)
      )
        continue;
      if (scenario.key === 'HISTORY' && candidate.fecha_hasta > now.toISODate()!) continue;
      if (
        scenario.key === 'CLIENT-CANCEL' &&
        !(await tx
          .getRepository(Cancelacion)
          .existsBy({ reserva_id: candidate.id, tipo_usuario: 'CLIENTE' }))
      )
        continue;
      reservation = candidate;
      break;
    }
    if (
      reservation &&
      (await tx
        .getRepository(Pago)
        .existsBy({ reserva_id: reservation.id, estado: scenario.payment }))
    )
      continue;
    if (!reservation) {
      const property = properties[0];
      if (!property) throw new Error('Faltan propiedades demo.');
      // Share the application's property lock; also avoid blocked periods and all existing stays.
      await tx.query('SELECT pg_advisory_xact_lock(71001, $1)', [property.id]);
      let from = '',
        to = '';
      for (let step = 0; step < 100; step++) {
        from = now
          .plus({ days: scenario.offset + (scenario.offset < 0 ? -step * 3 : step * 3) })
          .toISODate()!;
        to = DateTime.fromISO(from).plus({ days: 2 }).toISODate()!;
        const [result] = await tx.query(
          `SELECT EXISTS(SELECT 1 FROM reservas WHERE propiedad_id=$1 AND fecha_desde<$3::date AND fecha_hasta>$2::date
           UNION ALL SELECT 1 FROM periodos_bloqueados WHERE propiedad_id=$1 AND fecha_desde<$3::date AND fecha_hasta>$2::date) AS occupied`,
          [property.id, from, to],
        );
        if (!result.occupied) break;
        if (step === 99) throw new Error('No hay un intervalo libre para completar el seed.');
      }
      const created =
        scenario.offset < 0
          ? DateTime.fromISO(from, { zone: ZONE }).minus({ days: 5 })
          : now.minus({ hours: scenario.key === 'EXPIRED' ? 3 : 0 });
      reservation = await tx.save(Reserva, {
        propiedad_id: property.id,
        cliente_id: clientId,
        fecha_desde: from,
        fecha_hasta: to,
        cantidad_huespedes: Math.min(2, property.capacidad),
        fecha_creacion: created.toJSDate(),
        fecha_vencimiento_temporal: created.plus({ minutes: 90 }).toJSDate(),
        estado: scenario.state,
        ...quote(from, to, property.precio_noche, property.porcentaje_sena),
      });
      if (scenario.key === 'CLIENT-CANCEL')
        await tx.save(Cancelacion, {
          reserva_id: reservation.id,
          administrador_id: null,
          cliente_id: clientId,
          tipo_usuario: 'CLIENTE',
          fecha: now.toJSDate(),
          motivo: 'Cancelación del cliente de demostración',
          es_excepcional: false,
          requiere_reintegro: true,
        });
    }
    await tx.save(Pago, {
      reserva_id: reservation.id,
      monto: reservation.importe_sena,
      fecha: new Date(reservation.fecha_creacion),
      estado: scenario.payment,
      id_transaccion_externa: reference,
    });
  }
}
