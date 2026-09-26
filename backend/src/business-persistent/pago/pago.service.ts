import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoEntity } from './pago.entity';

@Injectable()
export class PagoService {
  constructor(@InjectRepository(PagoEntity) private readonly repository: Repository<PagoEntity>) {}

  // TODO: agregar operaciones CRUD y reglas del dominio usando este repositorio.
  // Esta base no implementa todavía lógica de negocio ni consultas públicas.
}
