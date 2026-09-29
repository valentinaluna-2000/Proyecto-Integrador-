import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DateTime } from 'luxon';
import Decimal from 'decimal.js';
import { Actor, dates, ZONE } from '../common/domain';
import { ILogicaReportes } from '../common/ports';
import { ReportDto } from '../common/dtos';
export function occupancy(nights: number, available: number) {
  return available ? Math.round((nights / available) * 10000) / 100 : 0;
}
@Injectable()
export class ReportsService implements ILogicaReportes {
  constructor(private db: DataSource) {}
  async report(kind: string, actor: Actor, f: ReportDto) {
    if (!['reservations', 'income', 'occupancy', 'cancellations', 'performance'].includes(kind))
      throw new BadRequestException('Reporte desconocido.');
    const from = f.fecha_desde || DateTime.now().setZone(ZONE).startOf('month').toISODate()!,
      to =
        f.fecha_hasta ||
        DateTime.now().setZone(ZONE).plus({ months: 1 }).startOf('month').toISODate()!;
    const { nights } = dates(from, to);
    if (nights > 1096) throw new BadRequestException('El período máximo es de tres años.');
    const args = [actor.propietario_id, f.propiedad_id || null, from, to];
    const props = await this.db.query(
      'SELECT id,nombre FROM propiedades WHERE propietario_id=$1 AND ($2::int IS NULL OR id=$2)',
      args.slice(0, 2),
    );
    const reservations = await this.db.query(
      'SELECT r.*,p.nombre AS propiedad_nombre FROM reservas r JOIN propiedades p ON p.id=r.propiedad_id WHERE p.propietario_id=$1 AND ($2::int IS NULL OR p.id=$2) AND r.fecha_desde<$4::date AND r.fecha_hasta>$3::date ORDER BY r.fecha_desde',
      args,
    );
    const income = await this.db.query(
      "SELECT pay.*,p.nombre AS propiedad_nombre FROM pagos pay JOIN reservas r ON r.id=pay.reserva_id JOIN propiedades p ON p.id=r.propiedad_id WHERE p.propietario_id=$1 AND ($2::int IS NULL OR p.id=$2) AND pay.estado='APROBADO' AND pay.fecha>=($3::date::timestamp AT TIME ZONE 'America/Argentina/Cordoba') AND pay.fecha<($4::date::timestamp AT TIME ZONE 'America/Argentina/Cordoba') ORDER BY pay.fecha",
      args,
    );
    const cancellations = await this.db.query(
      "SELECT c.*,p.nombre AS propiedad_nombre FROM cancelaciones c JOIN reservas r ON r.id=c.reserva_id JOIN propiedades p ON p.id=r.propiedad_id WHERE p.propietario_id=$1 AND ($2::int IS NULL OR p.id=$2) AND c.fecha>=($3::date::timestamp AT TIME ZONE 'America/Argentina/Cordoba') AND c.fecha<($4::date::timestamp AT TIME ZONE 'America/Argentina/Cordoba') ORDER BY c.fecha",
      args,
    );
    const occupied = reservations
      .filter((r: any) => r.estado === 'CONFIRMADA')
      .reduce(
        (sum: number, r: any) =>
          sum +
          dates(
            r.fecha_desde < from ? from : r.fecha_desde,
            r.fecha_hasta > to ? to : r.fecha_hasta,
          ).nights,
        0,
      );
    const summary = {
      reservas_confirmadas: reservations.filter((r: any) => r.estado === 'CONFIRMADA').length,
      ingresos: income
        .reduce((sum: Decimal, p: any) => sum.plus(p.monto), new Decimal(0))
        .toFixed(2),
      ocupacion: occupancy(occupied, props.length * nights),
      noches_ocupadas: occupied,
      noches_disponibles: props.length * nights,
      cancelaciones: cancellations.length,
    };
    const rows =
      kind === 'reservations'
        ? reservations
        : kind === 'income'
          ? income
          : kind === 'cancellations'
            ? cancellations
            : props.map((p: any) => {
                const rs = reservations.filter(
                  (r: any) => r.propiedad_id === p.id && r.estado === 'CONFIRMADA',
                );
                const count = rs.reduce(
                  (n: number, r: any) =>
                    n +
                    dates(
                      r.fecha_desde < from ? from : r.fecha_desde,
                      r.fecha_hasta > to ? to : r.fecha_hasta,
                    ).nights,
                  0,
                );
                return {
                  propiedad: p.nombre,
                  reservas_confirmadas: rs.length,
                  noches_ocupadas: count,
                  ocupacion: occupancy(count, nights),
                };
              });
    return { fecha_desde: from, fecha_hasta: to, resumen: summary, filas: rows };
  }
}
