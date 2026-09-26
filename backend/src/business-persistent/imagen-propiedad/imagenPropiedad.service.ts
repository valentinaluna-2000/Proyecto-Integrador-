import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagenPropiedadEntity } from './imagen-propiedad.entity';

@Injectable()
export class ImagenPropiedadService {
  constructor(@InjectRepository(ImagenPropiedadEntity) private readonly repository: Repository<ImagenPropiedadEntity>) {}

  // TODO: agregar operaciones CRUD y reglas del dominio usando este repositorio.
  // Esta base no implementa todavía lógica de negocio ni consultas públicas.
}
