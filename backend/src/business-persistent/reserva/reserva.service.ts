import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservaEntity } from './reserva.entity';

@Injectable()
export class ReservaService {
  constructor(@InjectRepository(ReservaEntity) private readonly repository: Repository<ReservaEntity>) {}

  // TODO: agregar operaciones CRUD y reglas del dominio usando este repositorio.
  // Esta base no implementa todavía lógica de negocio ni consultas públicas.
}
