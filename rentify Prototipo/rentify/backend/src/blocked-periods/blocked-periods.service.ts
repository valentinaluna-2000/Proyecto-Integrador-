import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedPeriod } from './entities/blocked-period.entity';
import { Property } from '../properties/entities/property.entity';
import {
  Reservation,
  ReservationStatus,
} from '../reservations/entities/reservation.entity';
import { CreateBlockedPeriodDto } from './dto/create-blocked-period.dto';
import { UpdateBlockedPeriodDto } from './dto/update-blocked-period.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Injectable()
export class BlockedPeriodsService {
  constructor(
    @InjectRepository(BlockedPeriod)
    private blockedRepo: Repository<BlockedPeriod>,
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
  ) {}

  private async getOwnedProperty(propertyId: number, admin: JwtPayload) {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    if (property.propietarioId !== admin.propietarioId) {
      throw new ForbiddenException('No tenes acceso a esta propiedad.');
    }
    return property;
  }

  async findAll(propertyId: number) {
    return this.blockedRepo.find({
      where: { propertyId },
      order: { fechaDesde: 'ASC' },
    });
  }

  async create(
    propertyId: number,
    dto: CreateBlockedPeriodDto,
    admin: JwtPayload,
  ) {
    await this.getOwnedProperty(propertyId, admin);

    if (dto.fechaHasta <= dto.fechaDesde) {
      throw new BadRequestException(
        'La fecha hasta debe ser posterior a la fecha desde.',
      );
    }

    // No permitir bloquear fechas que ya tengan una reserva vigente.
    const overlapping = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.propertyId = :propertyId', { propertyId })
      .andWhere('r.fechaDesde <= :hasta', { hasta: dto.fechaHasta })
      .andWhere('r.fechaHasta >= :desde', { desde: dto.fechaDesde })
      .andWhere(
        `(r.estado = '${ReservationStatus.CONFIRMED}' OR (r.estado = '${ReservationStatus.PENDING_PAYMENT}' AND r.fechaVencimientoTemporal > NOW()))`,
      )
      .getCount();

    if (overlapping > 0) {
      throw new BadRequestException(
        'No es posible bloquear el periodo: existen reservas vigentes en esas fechas.',
      );
    }

    const period = this.blockedRepo.create({ ...dto, propertyId });
    return this.blockedRepo.save(period);
  }

  async update(
    propertyId: number,
    id: number,
    dto: UpdateBlockedPeriodDto,
    admin: JwtPayload,
  ) {
    await this.getOwnedProperty(propertyId, admin);
    const period = await this.blockedRepo.findOne({ where: { id, propertyId } });
    if (!period) throw new NotFoundException('Periodo bloqueado no encontrado.');
    Object.assign(period, dto);
    return this.blockedRepo.save(period);
  }

  async remove(propertyId: number, id: number, admin: JwtPayload) {
    await this.getOwnedProperty(propertyId, admin);
    const period = await this.blockedRepo.findOne({ where: { id, propertyId } });
    if (!period) throw new NotFoundException('Periodo bloqueado no encontrado.');
    await this.blockedRepo.remove(period);
    return { message: 'Periodo bloqueado eliminado correctamente.' };
  }

  async updateById(id: number, dto: UpdateBlockedPeriodDto, admin: JwtPayload) {
    const period = await this.blockedRepo.findOne({ where: { id } });
    if (!period) throw new NotFoundException('Periodo bloqueado no encontrado.');
    await this.getOwnedProperty(period.propertyId, admin);
    Object.assign(period, dto);
    return this.blockedRepo.save(period);
  }

  async removeById(id: number, admin: JwtPayload) {
    const period = await this.blockedRepo.findOne({ where: { id } });
    if (!period) throw new NotFoundException('Periodo bloqueado no encontrado.');
    await this.getOwnedProperty(period.propertyId, admin);
    await this.blockedRepo.remove(period);
    return { message: 'Periodo bloqueado eliminado correctamente.' };
  }
}
