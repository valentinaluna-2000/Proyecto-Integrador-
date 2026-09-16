import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Cliente } from '../users/entities/cliente.entity';
import { Administrador } from '../administradores/entities/administrador.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
    @InjectRepository(Administrador)
    private adminRepo: Repository<Administrador>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  private async emailExists(email: string): Promise<boolean> {
    const cliente = await this.clienteRepo.findOne({ where: { email } });
    if (cliente) return true;
    const admin = await this.adminRepo.findOne({ where: { email } });
    return !!admin;
  }

  async register(dto: RegisterDto) {
    if (await this.emailExists(dto.email)) {
      throw new ConflictException('El email ingresado ya se encuentra registrado.');
    }
    const hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const cliente = this.clienteRepo.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email,
      telefono: dto.telefono,
      fechaNacimiento: dto.fechaNacimiento,
      contrasena: hash,
    });
    const saved = await this.clienteRepo.save(cliente);
    return this.buildAuthResponse({
      sub: saved.id,
      email: saved.email,
      role: Role.CLIENTE,
      nombre: `${saved.nombre} ${saved.apellido}`,
    });
  }

  async login(dto: LoginDto) {
    const admin = await this.adminRepo.findOne({
      where: { email: dto.email },
      relations: ['propietario'],
    });
    if (admin) {
      if (!admin.activo) {
        throw new UnauthorizedException('La cuenta se encuentra deshabilitada.');
      }
      const match = await bcrypt.compare(dto.password, admin.contrasena);
      if (!match) {
        throw new UnauthorizedException('Credenciales invalidas.');
      }
      return this.buildAuthResponse({
        sub: admin.id,
        email: admin.email,
        role: Role.ADMINISTRADOR,
        propietarioId: admin.propietarioId,
        nombre: admin.usuario,
      });
    }

    const cliente = await this.clienteRepo.findOne({ where: { email: dto.email } });
    if (cliente) {
      if (!cliente.activo) {
        throw new UnauthorizedException('La cuenta se encuentra deshabilitada.');
      }
      const match = await bcrypt.compare(dto.password, cliente.contrasena);
      if (!match) {
        throw new UnauthorizedException('Credenciales invalidas.');
      }
      return this.buildAuthResponse({
        sub: cliente.id,
        email: cliente.email,
        role: Role.CLIENTE,
        nombre: `${cliente.nombre} ${cliente.apellido}`,
      });
    }

    throw new UnauthorizedException('Credenciales invalidas.');
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // Respuesta generica siempre, para no filtrar si el email existe o no.
    const genericResponse = {
      message:
        'Si el email existe en nuestro sistema, vas a recibir un correo con instrucciones.',
    };

    const cliente = await this.clienteRepo.findOne({ where: { email: dto.email } });
    const admin = !cliente
      ? await this.adminRepo.findOne({ where: { email: dto.email } })
      : null;

    if (!cliente && !admin) {
      return genericResponse;
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    if (cliente) {
      cliente.resetPasswordToken = token;
      cliente.resetPasswordExpires = expires;
      await this.clienteRepo.save(cliente);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const link = `${frontendUrl}/auth/restablecer-contrasena?token=${token}`;
      await this.mailService.sendPasswordReset(cliente.email, cliente.nombre, link);
    }

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const cliente = await this.clienteRepo.findOne({
      where: { resetPasswordToken: dto.token },
    });

    if (
      !cliente ||
      !cliente.resetPasswordExpires ||
      cliente.resetPasswordExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException('El token de recuperacion es invalido o expiro.');
    }

    cliente.contrasena = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    cliente.resetPasswordToken = null;
    cliente.resetPasswordExpires = null;
    await this.clienteRepo.save(cliente);

    return { message: 'La contrasena fue actualizada correctamente.' };
  }

  private buildAuthResponse(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        nombre: payload.nombre,
      },
    };
  }
}
