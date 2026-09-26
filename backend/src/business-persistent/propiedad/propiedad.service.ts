import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropiedadEntity } from './propiedad.entity';

@Injectable()
export class PropiedadService {
  constructor(@InjectRepository(PropiedadEntity) private readonly repository: Repository<PropiedadEntity>) {}

  // TODO: agregar operaciones CRUD y reglas del dominio usando este repositorio.
  // Esta base no implementa todavía lógica de negocio ni consultas públicas.
}
