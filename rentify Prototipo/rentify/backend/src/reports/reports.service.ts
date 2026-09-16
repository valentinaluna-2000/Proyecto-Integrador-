import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { Property } from '../properties/entities/property.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Cancellation } from '../cancellations/entities/cancellation.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

export interface ReportFilters {
  propertyId?: number;
  desde?: string;
  hasta?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Reservation) private reservationRepo: Repository<Reservation>,
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Cancellation)
    private cancellationRepo: Repository<Cancellation>,
  ) {}

  private baseReservationQb(admin: JwtPayload, filters: ReportFilters) {
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .innerJoin('r.property', 'property')
      .where('property.propietarioId = :propietarioId', {
        propietarioId: admin.propietarioId,
      });
    if (filters.propertyId) {
      qb.andWhere('r.propertyId = :propertyId', { propertyId: filters.propertyId });
    }
    if (filters.desde) qb.andWhere('r.fechaDesde >= :desde', { desde: filters.desde });
    if (filters.hasta) qb.andWhere('r.fechaHasta <= :hasta', { hasta: filters.hasta });
    return qb;
  }

  async reservationsReport(admin: JwtPayload, filters: ReportFilters) {
    const qb = this.baseReservationQb(admin, filters);
    const total = await qb.getCount();

    const porPropiedad = await this.baseReservationQb(admin, filters)
      .select('property.id', 'propertyId')
      .addSelect('property.nombre', 'nombre')
      .addSelect('COUNT(r.id)', 'cantidad')
      .groupBy('property.id')
      .addGroupBy('property.nombre')
      .getRawMany();

    return {
      totalReservas: total,
      porPropiedad: porPropiedad.map((r) => ({
        propertyId: Number(r.propertyId),
        nombre: r.nombre,
        cantidad: Number(r.cantidad),
      })),
    };
  }

  async revenueReport(admin: JwtPayload, filters: ReportFilters) {
    // Solo se consideran reservas cuyo pago fue efectivamente registrado
    // (aprobado), tal como exige el PDF oficial.
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .innerJoin('r.property', 'property')
      .innerJoin('r.pagos', 'pago')
      .where('property.propietarioId = :propietarioId', {
        propietarioId: admin.propietarioId,
      })
      .andWhere('pago.estado = :approved', { approved: PaymentStatus.APPROVED });

    if (filters.propertyId)
      qb.andWhere('r.propertyId = :propertyId', { propertyId: filters.propertyId });
    if (filters.desde) qb.andWhere('r.fechaDesde >= :desde', { desde: filters.desde });
    if (filters.hasta) qb.andWhere('r.fechaHasta <= :hasta', { hasta: filters.hasta });

    const totalIngresos = await qb
      .clone()
      .select('COALESCE(SUM(pago.monto), 0)', 'total')
      .getRawOne();

    const porPropiedad = await qb
      .clone()
      .select('property.id', 'propertyId')
      .addSelect('property.nombre', 'nombre')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'ingresos')
      .groupBy('property.id')
      .addGroupBy('property.nombre')
      .getRawMany();

    return {
      totalIngresos: Number(totalIngresos.total),
      porPropiedad: porPropiedad.map((r) => ({
        propertyId: Number(r.propertyId),
        nombre: r.nombre,
        ingresos: Number(r.ingresos),
      })),
    };
  }

  async occupancyReport(admin: JwtPayload, filters: ReportFilters) {
    const properties = await this.propertyRepo.find({
      where: { propietarioId: admin.propietarioId },
    });

    const desde = filters.desde ? new Date(filters.desde) : this.startOfMonth();
    const hasta = filters.hasta ? new Date(filters.hasta) : this.endOfMonth();
    const totalDias = Math.max(
      1,
      Math.round((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    const results: {
      propertyId: number;
      nombre: string;
      diasOcupados: number;
      totalDias: number;
      porcentajeOcupacion: number;
    }[] = [];
    for (const property of properties) {
      if (filters.propertyId && property.id !== filters.propertyId) continue;

      const reservas = await this.reservationRepo
        .createQueryBuilder('r')
        .where('r.propertyId = :id', { id: property.id })
        .andWhere('r.estado IN (:...estados)', {
          estados: [ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED],
        })
        .andWhere('r.fechaDesde <= :hasta', { hasta: hasta.toISOString().slice(0, 10) })
        .andWhere('r.fechaHasta >= :desde', { desde: desde.toISOString().slice(0, 10) })
        .getMany();

      let diasOcupados = 0;
      for (const r of reservas) {
        const inicio = new Date(
          Math.max(new Date(`${r.fechaDesde}T00:00:00Z`).getTime(), desde.getTime()),
        );
        const fin = new Date(
          Math.min(new Date(`${r.fechaHasta}T00:00:00Z`).getTime(), hasta.getTime()),
        );
        const dias = Math.max(
          0,
          Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)),
        );
        diasOcupados += dias;
      }

      results.push({
        propertyId: property.id,
        nombre: property.nombre,
        diasOcupados,
        totalDias,
        porcentajeOcupacion: Math.round((diasOcupados / totalDias) * 10000) / 100,
      });
    }
    return { periodo: { desde: filters.desde, hasta: filters.hasta }, propiedades: results };
  }

  async cancellationsReport(admin: JwtPayload, filters: ReportFilters) {
    const qb = this.cancellationRepo
      .createQueryBuilder('c')
      .innerJoin('c.reservation', 'reservation')
      .innerJoin('reservation.property', 'property')
      .where('property.propietarioId = :propietarioId', {
        propietarioId: admin.propietarioId,
      });
    if (filters.propertyId)
      qb.andWhere('reservation.propertyId = :propertyId', {
        propertyId: filters.propertyId,
      });

    const total = await qb.getCount();
    const porTipoUsuario = await qb
      .clone()
      .select('c.tipoUsuario', 'tipoUsuario')
      .addSelect('COUNT(c.id)', 'cantidad')
      .groupBy('c.tipoUsuario')
      .getRawMany();
    const excepcionales = await qb
      .clone()
      .andWhere('c.esExcepcional = true')
      .getCount();

    return {
      totalCancelaciones: total,
      excepcionales,
      porTipoUsuario: porTipoUsuario.map((r) => ({
        tipoUsuario: r.tipoUsuario,
        cantidad: Number(r.cantidad),
      })),
    };
  }

  async performanceReport(admin: JwtPayload, filters: ReportFilters) {
    const [reservas, ingresos, ocupacion, cancelaciones] = await Promise.all([
      this.reservationsReport(admin, filters),
      this.revenueReport(admin, filters),
      this.occupancyReport(admin, filters),
      this.cancellationsReport(admin, filters),
    ]);

    const properties = await this.propertyRepo.find({
      where: { propietarioId: admin.propietarioId },
    });

    const indicadores = properties
      .filter((p) => !filters.propertyId || p.id === filters.propertyId)
      .map((p) => {
        const reservasProp = reservas.porPropiedad.find((r) => r.propertyId === p.id);
        const ingresosProp = ingresos.porPropiedad.find((r) => r.propertyId === p.id);
        const ocupacionProp = ocupacion.propiedades.find((r) => r.propertyId === p.id);
        return {
          propertyId: p.id,
          nombre: p.nombre,
          cantidadReservas: reservasProp?.cantidad || 0,
          ingresos: ingresosProp?.ingresos || 0,
          porcentajeOcupacion: ocupacionProp?.porcentajeOcupacion || 0,
        };
      });

    return {
      indicadores,
      resumen: {
        totalReservas: reservas.totalReservas,
        totalIngresos: ingresos.totalIngresos,
        totalCancelaciones: cancelaciones.totalCancelaciones,
      },
    };
  }

  private startOfMonth(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  private endOfMonth(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }
}
