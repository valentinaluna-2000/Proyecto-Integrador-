import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Cliente } from './entities/cliente.entity';
import { Administrador } from '../administradores/entities/administrador.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role } from '../common/enums/role.enum';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
    @InjectRepository(Administrador)
    private adminRepo: Repository<Administrador>,
  ) {}

  async getMe(user: JwtPayload) {
    if (user.role === Role.CLIENTE) {
      const cliente = await this.clienteRepo.findOne({ where: { id: user.sub } });
      if (!cliente) throw new NotFoundException('Usuario no encontrado.');
      const { contrasena, resetPasswordToken, resetPasswordExpires, ...rest } = cliente;
      return { ...rest, role: Role.CLIENTE };
    }
    const admin = await this.adminRepo.findOne({
      where: { id: user.sub },
      relations: ['propietario'],
    });
    if (!admin) throw new NotFoundException('Usuario no encontrado.');
    const { contrasena, ...rest } = admin;
    return { ...rest, role: Role.ADMINISTRADOR };
  }

  async updateMe(user: JwtPayload, dto: UpdateMeDto) {
    if (user.role === Role.CLIENTE) {
      const cliente = await this.clienteRepo.findOne({ where: { id: user.sub } });
      if (!cliente) throw new NotFoundException('Usuario no encontrado.');
      if (dto.nombre) cliente.nombre = dto.nombre;
      if (dto.apellido) cliente.apellido = dto.apellido;
      if (dto.telefono) cliente.telefono = dto.telefono;
      if (dto.password) cliente.contrasena = await bcrypt.hash(dto.password, 10);
      await this.clienteRepo.save(cliente);
      const { contrasena, resetPasswordToken, resetPasswordExpires, ...rest } = cliente;
      return { ...rest, role: Role.CLIENTE };
    }
    const admin = await this.adminRepo.findOne({ where: { id: user.sub } });
    if (!admin) throw new NotFoundException('Usuario no encontrado.');
    if (dto.nombre) admin.usuario = dto.nombre;
    if (dto.password) admin.contrasena = await bcrypt.hash(dto.password, 10);
    await this.adminRepo.save(admin);
    const { contrasena, ...rest } = admin;
    return { ...rest, role: Role.ADMINISTRADOR };
  }
}
