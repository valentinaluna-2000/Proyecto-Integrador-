import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodoBloqueadoEntity } from './periodo-bloqueado.entity';

@Injectable()
export class PeriodoBloqueadoService {
  constructor(@InjectRepository(PeriodoBloqueadoEntity) private readonly repository: Repository<PeriodoBloqueadoEntity>) {}

  // TODO: agregar operaciones CRUD y reglas del dominio usando este repositorio.
  // Esta base no implementa todavía lógica de negocio ni consultas públicas.
}
