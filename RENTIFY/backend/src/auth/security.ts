import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Actor, Rol } from '../common/domain';
import { IAutenticacion } from '../common/ports';
import { Administrador, Cliente } from '../persistence/entities';
export const Roles = (...roles: Rol[]) => SetMetadata('roles', roles);
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor => ctx.switchToHttp().getRequest().user,
);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private auth: IAutenticacion,
    private db: DataSource,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
    if (!match) throw new UnauthorizedException('Iniciá sesión para continuar.');
    const user = await this.auth.identity(match[1]);
    if (!user.verified)
      throw new UnauthorizedException('Primero debés verificar tu correo electrónico.');
    const admin = await this.db.getRepository(Administrador).findOneBy({ auth_user_id: user.id });
    const client = admin
      ? null
      : await this.db.getRepository(Cliente).findOneBy({ auth_user_id: user.id });
    if (!admin && !client) throw new ForbiddenException('La cuenta no tiene un perfil Rentify.');
    req.user = { ...(admin || client), role: admin ? Rol.ADMINISTRADOR : Rol.CLIENTE };
    return true;
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Rol[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (roles && !roles.includes(ctx.switchToHttp().getRequest().user?.role))
      throw new ForbiddenException('No tenés permiso para realizar esta operación.');
    return true;
  }
}
