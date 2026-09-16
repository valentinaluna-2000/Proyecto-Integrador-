import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Property, PropertyStatus } from '../properties/entities/property.entity';
import { BlockedPeriod } from '../blocked-periods/entities/blocked-period.entity';
import {
  Cancellation,
  TipoUsuarioCancelacion,
} from '../cancellations/entities/cancellation.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role } from '../common/enums/role.enum';
import { Cliente } from '../users/entities/cliente.entity';
import { MailService } from '../mail/mail.service';

export const RESERVATION_HOLD_MINUTES = parseInt(
  process.env.RESERVATION_HOLD_MINUTES || '90',
  10,
);
const CANCELLATION_WINDOW_HOURS = 72;

export function diffInNights(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  const ms = toDate.getTime() - fromDate.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

@Injectable()
export class ReservationsService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Reservation) private reservationRepo: Repository<Reservation>,
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Cancellation) private cancellationRepo: Repository<Cancellation>,
    private mailService: MailService,
  ) {}

  /**
   * Calcula noches, importe total y sena para una propiedad y rango de fechas,
   * sin crear la reserva. Utilizado por el frontend para mostrar el resumen
   * antes de confirmar.
   */
  async simulate(propertyId: number, fechaDesde: string, fechaHasta: string) {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    this.validateDates(property, fechaDesde, fechaHasta);
    const noches = diffInNights(fechaDesde, fechaHasta);
    const importeTotal = this.round2(noches * Number(property.precioNoche));
    const importeSena = this.round2(
      (importeTotal * Number(property.porcentajeSena)) / 100,
    );
    return { noches, importeTotal, importeSena, precioNoche: property.precioNoche };
  }

  private validateDates(property: Property, fechaDesde: string, fechaHasta: string) {
    if (property.estado !== PropertyStatus.ACTIVA) {
      throw new BadRequestException('La propiedad no se encuentra activa.');
    }
    if (fechaHasta <= fechaDesde) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la fecha de entrada.',
      );
    }
    const hoy = new Date().toISOString().slice(0, 10);
    if (fechaDesde < hoy) {
      throw new BadRequestException('La fecha de entrada no puede ser en el pasado.');
    }
    const limite = new Date();
    limite.setMonth(limite.getMonth() + property.limiteMesesReserva);
    const limiteStr = limite.toISOString().slice(0, 10);
    if (fechaDesde > limiteStr) {
      throw new BadRequestException(
        `Esta propiedad no admite reservas con mas de ${property.limiteMesesReserva} meses de anticipacion.`,
      );
    }
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /**
   * Crea una reserva de forma transaccional y segura ante condiciones de
   * carrera: se bloquea la fila de la propiedad (SELECT ... FOR UPDATE) y se
   * vuelven a chequear solapamientos dentro de la misma transaccion antes de
   * insertar. Ademas, la base de datos cuenta con una restriccion de
   * exclusion (ver migracion) como segunda barrera de seguridad.
   */
  async create(dto: CreateReservationDto, user: JwtPayload) {
    if (user.role !== Role.CLIENTE) {
      throw new ForbiddenException('Solo los clientes pueden crear reservas.');
    }

    return this.dataSource.transaction(async (manager) => {
      const property = await manager
        .getRepository(Property)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: dto.propertyId })
        .getOne();

      if (!property) throw new NotFoundException('Propiedad no encontrada.');
      this.validateDates(property, dto.fechaDesde, dto.fechaHasta);

      const overlappingBlocked = await manager
        .getRepository(BlockedPeriod)
        .createQueryBuilder('b')
        .where('b.propertyId = :id', { id: dto.propertyId })
        .andWhere('b.fechaDesde <= :hasta', { hasta: dto.fechaHasta })
        .andWhere('b.fechaHasta >= :desde', { desde: dto.fechaDesde })
        .getCount();

      if (overlappingBlocked > 0) {
        throw new BadRequestException(
          'La propiedad no esta disponible en las fechas seleccionadas (periodo bloqueado).',
        );
      }

      const overlappingReservation = await manager
        .getRepository(Reservation)
        .createQueryBuilder('r')
        .setLock('pessimistic_write')
        .where('r.propertyId = :id', { id: dto.propertyId })
        .andWhere('r.fechaDesde <= :hasta', { hasta: dto.fechaHasta })
        .andWhere('r.fechaHasta >= :desde', { desde: dto.fechaDesde })
        .andWhere(
          `(r.estado = :confirmed OR (r.estado = :pending AND r.fechaVencimientoTemporal > NOW()))`,
        )
        .setParameters({
          confirmed: ReservationStatus.CONFIRMED,
          pending: ReservationStatus.PENDING_PAYMENT,
        })
        .getMany();

      if (overlappingReservation.length > 0) {
        throw new BadRequestException(
          'Las fechas seleccionadas ya no estan disponibles para esta propiedad.',
        );
      }

      const noches = diffInNights(dto.fechaDesde, dto.fechaHasta);
      const importeTotal = this.round2(noches * Number(property.precioNoche));
      const importeSena = this.round2(
        (importeTotal * Number(property.porcentajeSena)) / 100,
      );
      const expiresAt = new Date(Date.now() + RESERVATION_HOLD_MINUTES * 60 * 1000);

      const reservation = manager.getRepository(Reservation).create({
        propertyId: dto.propertyId,
        clienteId: user.sub,
        fechaDesde: dto.fechaDesde,
        fechaHasta: dto.fechaHasta,
        noches,
        precioNocheSnapshot: property.precioNoche,
        importeTotal,
        importeSena,
        estado: ReservationStatus.PENDING_PAYMENT,
        fechaVencimientoTemporal: expiresAt,
      });

      try {
        return await manager.getRepository(Reservation).save(reservation);
      } catch (err: any) {
        // Segunda barrera: restriccion de exclusion a nivel de base de datos
        // (btree_gist) ante condiciones de carrera extremas.
        if (err?.code === '23P01' || err?.code === '23505') {
          throw new BadRequestException(
            'Las fechas seleccionadas ya no estan disponibles para esta propiedad.',
          );
        }
        throw err;
      }
    });
  }

  async findMine(user: JwtPayload, query: QueryReservationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.property', 'property')
      .leftJoinAndSelect('r.pagos', 'pagos')
      .where('r.clienteId = :clienteId', { clienteId: user.sub });
    if (query.estado) qb.andWhere('r.estado = :estado', { estado: query.estado });
    qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findAllAdmin(admin: JwtPayload, query: QueryReservationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.property', 'property')
      .leftJoinAndSelect('r.cliente', 'cliente')
      .leftJoinAndSelect('r.pagos', 'pagos')
      .where('property.propietarioId = :propietarioId', {
        propietarioId: admin.propietarioId,
      });
    if (query.estado) qb.andWhere('r.estado = :estado', { estado: query.estado });
    if (query.propertyId)
      qb.andWhere('r.propertyId = :propertyId', { propertyId: query.propertyId });
    if (query.desde) qb.andWhere('r.fechaDesde >= :desde', { desde: query.desde });
    if (query.hasta) qb.andWhere('r.fechaHasta <= :hasta', { hasta: query.hasta });
    qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number, user: JwtPayload): Promise<Reservation> {
    const reservation = await this.reservationRepo.findOne({
      where: { id },
      relations: ['property', 'cliente', 'pagos', 'cancelacion'],
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada.');
    if (user.role === Role.CLIENTE && reservation.clienteId !== user.sub) {
      throw new ForbiddenException('No tenes acceso a esta reserva.');
    }
    if (
      user.role === Role.ADMINISTRADOR &&
      reservation.property.propietarioId !== user.propietarioId
    ) {
      throw new ForbiddenException('No tenes acceso a esta reserva.');
    }
    return reservation;
  }

  async cancel(id: number, dto: CancelReservationDto, user: JwtPayload) {
    const reservation = await this.findOne(id, user);

    if (
      reservation.estado === ReservationStatus.CANCELLED ||
      reservation.estado === ReservationStatus.EXPIRED
    ) {
      throw new BadRequestException('La reserva ya se encuentra cancelada o vencida.');
    }
    if (reservation.estado === ReservationStatus.COMPLETED) {
      throw new BadRequestException('La estadia ya finalizo, no se puede cancelar.');
    }

    const hoy = new Date();
    const fechaDesde = new Date(`${reservation.fechaDesde}T00:00:00`);

    if (hoy >= fechaDesde) {
      throw new BadRequestException(
        'La reserva ya comenzo y no puede ser cancelada desde el sistema.',
      );
    }

    const horasHastaIngreso =
      (fechaDesde.getTime() - hoy.getTime()) / (1000 * 60 * 60);

    if (horasHastaIngreso < CANCELLATION_WINDOW_HOURS && !dto.causaExcepcional) {
      throw new BadRequestException(
        `Solo se puede cancelar hasta ${CANCELLATION_WINDOW_HOURS} horas antes del ingreso, salvo causa excepcional.`,
      );
    }

    const pagoAprobado = (reservation.pagos || []).some(
      (p) => p.estado === PaymentStatus.APPROVED,
    );

    const esAdmin = user.role === Role.ADMINISTRADOR;
    const generoReintegro = esAdmin ? pagoAprobado : false;

    let usuarioNombre = '';
    if (esAdmin) {
      usuarioNombre = user.nombre || user.email;
    } else {
      const cliente = await this.clienteRepo.findOne({ where: { id: user.sub } });
      usuarioNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : user.email;
    }

    const cancellation = this.cancellationRepo.create({
      reservationId: reservation.id,
      tipoUsuario: esAdmin
        ? TipoUsuarioCancelacion.ADMINISTRADOR
        : TipoUsuarioCancelacion.CLIENTE,
      usuarioId: user.sub,
      usuarioNombre,
      motivo: dto.motivo,
      esExcepcional: !!dto.causaExcepcional,
      generoReintegro,
    });

    reservation.estado = ReservationStatus.CANCELLED;

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Cancellation).save(cancellation);
      await manager.getRepository(Reservation).save(reservation);
    });

    return { ...reservation, cancelacion: cancellation };
  }

  /**
   * Job periodico: vence reservas PENDING_PAYMENT cuyo plazo de pago expiro,
   * y marca como COMPLETED las reservas confirmadas cuya estadia ya finalizo.
   * Ver ReservationsScheduler.
   */
  async expireOverdueReservations(): Promise<number> {
    const result = await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({ estado: ReservationStatus.EXPIRED })
      .where('estado = :pending', { pending: ReservationStatus.PENDING_PAYMENT })
      .andWhere('fechaVencimientoTemporal <= NOW()')
      .execute();
    return result.affected || 0;
  }

  async completeFinishedStays(): Promise<number> {
    const hoy = new Date().toISOString().slice(0, 10);
    const result = await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({ estado: ReservationStatus.COMPLETED })
      .where('estado = :confirmed', { confirmed: ReservationStatus.CONFIRMED })
      .andWhere('fechaHasta < :hoy', { hoy })
      .execute();
    return result.affected || 0;
  }

  async confirmAfterPayment(reservationId: number) {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
      relations: ['cliente', 'property'],
    });
    if (!reservation) return;
    if (reservation.estado !== ReservationStatus.PENDING_PAYMENT) return;
    reservation.estado = ReservationStatus.CONFIRMED;
    await this.reservationRepo.save(reservation);
    await this.mailService.sendReservationConfirmation(
      reservation.cliente.email,
      reservation.cliente.nombre,
      `Tu reserva en "${reservation.property.nombre}" del ${reservation.fechaDesde} al ${reservation.fechaHasta} fue confirmada.`,
    );
  }
}
