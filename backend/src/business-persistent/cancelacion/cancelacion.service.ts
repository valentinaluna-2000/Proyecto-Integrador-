import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CancelacionEntity } from './cancelacion.entity';

@Injectable()
export class CancelacionService {
  constructor(@InjectRepository(CancelacionEntity) private readonly repository: Repository<CancelacionEntity>) {}

  // TODO: agregar operaciones CRUD y reglas del dominio usando este repositorio.
  // Esta base no implementa todavía lógica de negocio ni consultas públicas.
}
