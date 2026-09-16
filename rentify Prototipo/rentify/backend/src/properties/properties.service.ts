import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Property, PropertyStatus } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { BlockedPeriod } from '../blocked-periods/entities/blocked-period.entity';
import {
  Reservation,
  ReservationStatus,
} from '../reservations/entities/reservation.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(BlockedPeriod)
    private blockedRepo: Repository<BlockedPeriod>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
  ) {}

  async create(dto: CreatePropertyDto, admin: JwtPayload): Promise<Property> {
    const property = this.propertyRepo.create({
      ...dto,
      propietarioId: admin.propietarioId,
      estado: PropertyStatus.ACTIVA,
    });
    return this.propertyRepo.save(property);
  }

  async findAllForAdmin(admin: JwtPayload): Promise<Property[]> {
    return this.propertyRepo.find({
      where: { propietarioId: admin.propietarioId },
      relations: ['imagenes'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPublic(query: QueryPropertiesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.imagenes', 'imagenes')
      .where('p.estado = :estado', { estado: PropertyStatus.ACTIVA });

    if (query.ciudad) {
      qb.andWhere('LOWER(p.ciudad) LIKE LOWER(:ciudad)', {
        ciudad: `%${query.ciudad}%`,
      });
    }
    if (query.tipo) {
      qb.andWhere('p.tipo = :tipo', { tipo: query.tipo });
    }
    if (query.precioMin !== undefined) {
      qb.andWhere('p.precioNoche >= :precioMin', { precioMin: query.precioMin });
    }
    if (query.precioMax !== undefined) {
      qb.andWhere('p.precioNoche <= :precioMax', { precioMax: query.precioMax });
    }
    if (query.capacidadMinima !== undefined) {
      qb.andWhere('p.capacidad >= :capacidadMinima', {
        capacidadMinima: query.capacidadMinima,
      });
    }
    if (query.aceptaMascotas !== undefined) {
      qb.andWhere('p.aceptaMascotas = :aceptaMascotas', {
        aceptaMascotas: query.aceptaMascotas,
      });
    }

    if (query.fechaDesde && query.fechaHasta) {
      // Excluir propiedades que tengan bloqueos o reservas vigentes que se
      // superpongan con el rango de fechas solicitado.
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where(
              `NOT EXISTS (
                SELECT 1 FROM periodos_bloqueados pb
                WHERE pb.property_id = p.id
                  AND pb.fecha_desde <= :fechaHasta
                  AND pb.fecha_hasta >= :fechaDesde
              )`,
            )
            .andWhere(
              `NOT EXISTS (
                SELECT 1 FROM reservas r
                WHERE r.property_id = p.id
                  AND r.fecha_desde <= :fechaHasta
                  AND r.fecha_hasta >= :fechaDesde
                  AND (
                    r.estado = '${ReservationStatus.CONFIRMED}'
                    OR (r.estado = '${ReservationStatus.PENDING_PAYMENT}' AND r.fecha_vencimiento_temporal > NOW())
                  )
              )`,
            );
        }),
      );
      qb.setParameters({
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
      });
    }

    qb.orderBy('p.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOnePublic(id: number): Promise<Property> {
    const property = await this.propertyRepo.findOne({
      where: { id },
      relations: ['imagenes'],
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    return property;
  }

  async findOneForAdmin(id: number, admin: JwtPayload): Promise<Property> {
    const property = await this.findOnePublic(id);
    this.assertOwnership(property, admin);
    return property;
  }

  async update(
    id: number,
    dto: UpdatePropertyDto,
    admin: JwtPayload,
  ): Promise<Property> {
    const property = await this.findOneForAdmin(id, admin);
    Object.assign(property, dto);
    return this.propertyRepo.save(property);
  }

  /** Baja logica: nunca se borra fisicamente una propiedad con historial. */
  async deactivate(id: number, admin: JwtPayload): Promise<Property> {
    const property = await this.findOneForAdmin(id, admin);
    property.estado = PropertyStatus.INACTIVA;
    return this.propertyRepo.save(property);
  }

  async activate(id: number, admin: JwtPayload): Promise<Property> {
    const property = await this.findOneForAdmin(id, admin);
    property.estado = PropertyStatus.ACTIVA;
    return this.propertyRepo.save(property);
  }

  async getAvailability(id: number, from?: string, to?: string) {
    const property = await this.findOnePublic(id);

    const blockedQb = this.blockedRepo
      .createQueryBuilder('b')
      .where('b.propertyId = :id', { id });
    const reservationQb = this.reservationRepo
      .createQueryBuilder('r')
      .where('r.propertyId = :id', { id })
      .andWhere(
        `(r.estado = '${ReservationStatus.CONFIRMED}' OR (r.estado = '${ReservationStatus.PENDING_PAYMENT}' AND r.fechaVencimientoTemporal > NOW()))`,
      );

    if (from && to) {
      blockedQb
        .andWhere('b.fechaDesde <= :to', { to })
        .andWhere('b.fechaHasta >= :from', { from });
      reservationQb
        .andWhere('r.fechaDesde <= :to', { to })
        .andWhere('r.fechaHasta >= :from', { from });
    }

    const [bloqueados, reservados] = await Promise.all([
      blockedQb.getMany(),
      reservationQb.getMany(),
    ]);

    return {
      propertyId: property.id,
      limiteMesesReserva: property.limiteMesesReserva,
      periodosBloqueados: bloqueados.map((b) => ({
        fechaDesde: b.fechaDesde,
        fechaHasta: b.fechaHasta,
        motivo: b.motivo,
      })),
      periodosReservados: reservados.map((r) => ({
        fechaDesde: r.fechaDesde,
        fechaHasta: r.fechaHasta,
        estado: r.estado,
      })),
    };
  }

  private assertOwnership(property: Property, admin: JwtPayload) {
    if (property.propietarioId !== admin.propietarioId) {
      throw new ForbiddenException('No tenes acceso a esta propiedad.');
    }
  }

  async findEntityOrThrow(id: number): Promise<Property> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    return property;
  }
}
