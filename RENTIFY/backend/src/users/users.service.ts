import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Actor, Rol } from '../common/domain';
import { ILogicaUsuarios } from '../common/ports';
import { Administrador, Cliente } from '../persistence/entities';
import { ProfileDto } from '../common/dtos';
@Injectable()
export class UsersService implements ILogicaUsuarios {
  constructor(private db: DataSource) {}
  async me(actor: Actor) {
    return {
      id: actor.id,
      role: actor.role,
      nombre: actor.nombre,
      apellido: actor.apellido,
      email: actor.email,
      ...(actor.role === Rol.CLIENTE ? { telefono: actor.telefono } : {}),
    };
  }
  async update(actor: Actor, data: ProfileDto) {
    if (actor.role === Rol.ADMINISTRADOR) {
      if (data.telefono !== undefined)
        throw new BadRequestException(
          'Los administradores no pueden actualizar el teléfono desde este perfil.',
        );
      if (data.nombre === undefined && data.apellido === undefined)
        throw new BadRequestException(
          'Indicá al menos un dato para actualizar.',
        );
      await this.db
        .getRepository(Administrador)
        .update(actor.id, { nombre: data.nombre, apellido: data.apellido });
    } else {
      if (
        data.nombre === undefined &&
        data.apellido === undefined &&
        data.telefono === undefined
      )
        throw new BadRequestException(
          'Indicá al menos un dato para actualizar.',
        );
      await this.db.getRepository(Cliente).update(actor.id, data);
    }
    return { message: 'Perfil actualizado.' };
  }
}
