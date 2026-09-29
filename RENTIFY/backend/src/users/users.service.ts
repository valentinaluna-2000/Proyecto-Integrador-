import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Actor, Rol } from '../common/domain';
import { ILogicaUsuarios } from '../common/ports';
import { Administrador, Cliente } from '../persistence/entities';
import { ProfileDto } from '../common/dtos';
@Injectable()
export class UsersService implements ILogicaUsuarios {
  constructor(private db: DataSource) {}
  async me(actor: Actor) {
    return actor;
  }
  async update(actor: Actor, data: ProfileDto) {
    if (actor.role === Rol.ADMINISTRADOR) {
      await this.db
        .getRepository(Administrador)
        .update(actor.id, { nombre: data.nombre, apellido: data.apellido });
    } else await this.db.getRepository(Cliente).update(actor.id, data);
    return { message: 'Perfil actualizado.' };
  }
}
