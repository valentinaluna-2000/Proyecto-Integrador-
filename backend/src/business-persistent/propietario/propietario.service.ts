import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropietarioEntity } from './propietario.entity';

@Injectable()
export class PropietarioService {
  constructor(@InjectRepository(PropietarioEntity) private readonly repository: Repository<PropietarioEntity>) {}

  // TODO: agregar operaciones CRUD y reglas del dominio usando este repositorio.
  // Esta base no implementa todavía lógica de negocio ni consultas públicas.
}
