import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { validationPipe } from '../src/common/validation';
import request from 'supertest';
import {
  PropertiesController,
  AdminPropertiesController,
} from '../src/properties/properties.controller';
import { ReservationsController } from '../src/reservations/reservations.controller';
import { AuthController } from '../src/auth/auth.controller';
import { PropertiesService } from '../src/properties/properties.service';
import { ReservationsService } from '../src/reservations/reservations.service';
import { AvailabilityService } from '../src/availability/availability.service';
import { ExternalService } from '../src/integrations/external.service';
import { PaymentsService } from '../src/payments/payments.service';
import { CancellationsService } from '../src/cancellations/cancellations.service';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { AuthGuard, RolesGuard } from '../src/auth/security';
import { IAutenticacion } from '../src/common/ports';
import { DataSource } from 'typeorm';
describe('API REST pública y protegida', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        PropertiesController,
        AdminPropertiesController,
        ReservationsController,
        AuthController,
      ],
      providers: [
        AuthGuard,
        RolesGuard,
        { provide: DataSource, useValue: {} },
        { provide: IAutenticacion, useValue: {} },
        {
          provide: PropertiesService,
          useValue: { list: () => ({ items: [{ id: 1, nombre: 'Casa' }], total: 1, page: 1, limit: 12 }) },
        },
        { provide: ReservationsService, useValue: {} },
        { provide: AvailabilityService, useValue: {} },
        { provide: ExternalService, useValue: {} },
        { provide: PaymentsService, useValue: {} },
        { provide: CancellationsService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(validationPipe());
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  test('visitante consulta propiedades', () =>
    request(app.getHttpServer())
      .get('/properties')
      .expect(200)
      .expect({ items: [{ id: 1, nombre: 'Casa' }], total: 1, page: 1, limit: 12 }));
  test('visitante no puede reservar', () =>
    request(app.getHttpServer()).post('/reservations').send({}).expect(401));
  test('visitante no administra propiedades', () =>
    request(app.getHttpServer()).post('/admin/properties').send({}).expect(401));
  test('registro rechaza DTO inválido y rol inyectado', () =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'invalid', rol: 'ADMINISTRADOR' })
      .expect(400));
  test('filtros inválidos producen 400', () =>
    request(app.getHttpServer()).get('/properties?capacidad=-1').expect(400));
  test('la paginación rechaza páginas y tamaños inválidos', async () => {
    await request(app.getHttpServer()).get('/properties?page=0').expect(400);
    await request(app.getHttpServer()).get('/properties?limit=101').expect(400);
  });
});
