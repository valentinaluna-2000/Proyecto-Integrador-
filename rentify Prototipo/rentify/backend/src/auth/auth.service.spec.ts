import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Cliente } from '../users/entities/cliente.entity';
import { Administrador } from '../administradores/entities/administrador.entity';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let clienteRepo: any;
  let adminRepo: any;

  beforeEach(async () => {
    clienteRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => ({ id: 1, ...x })),
    };
    adminRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Cliente), useValue: clienteRepo },
        { provide: getRepositoryToken(Administrador), useValue: adminRepo },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'fake-jwt-token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: MailService,
          useValue: { sendPasswordReset: jest.fn(), sendReservationConfirmation: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('rechaza credenciales cuando el email no existe en ninguna tabla', async () => {
      clienteRepo.findOne.mockResolvedValue(null);
      adminRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nadie@test.com', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza password incorrecta para un cliente existente', async () => {
      const hash = await bcrypt.hash('Password123', 10);
      adminRepo.findOne.mockResolvedValue(null);
      clienteRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'cliente@test.com',
        contrasena: hash,
        activo: true,
        nombre: 'Test',
        apellido: 'User',
      });
      await expect(
        service.login({ email: 'cliente@test.com', password: 'Incorrecta1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('permite login exitoso con password correcta', async () => {
      const hash = await bcrypt.hash('Password123', 10);
      adminRepo.findOne.mockResolvedValue(null);
      clienteRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'cliente@test.com',
        contrasena: hash,
        activo: true,
        nombre: 'Test',
        apellido: 'User',
      });
      const result = await service.login({
        email: 'cliente@test.com',
        password: 'Password123',
      });
      expect(result.accessToken).toBe('fake-jwt-token');
      expect(result.user.role).toBe('CLIENTE');
    });
  });

  describe('register', () => {
    it('rechaza el registro si el email ya existe', async () => {
      clienteRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.register({
          nombre: 'A',
          apellido: 'B',
          email: 'existente@test.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
