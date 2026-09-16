import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Property, PropertyStatus, PropertyType } from '../properties/entities/property.entity';
import { Cliente } from '../users/entities/cliente.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Cancellation } from '../cancellations/entities/cancellation.entity';
import { MailService } from '../mail/mail.service';
import { Role } from '../common/enums/role.enum';

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

describe('ReservationsService', () => {
  let service: ReservationsService;
  let propertyRepo: { findOne: jest.Mock };
  let reservationRepo: { findOne: jest.Mock };

  const mockProperty: Partial<Property> = {
    id: 1,
    estado: PropertyStatus.ACTIVA,
    tipo: PropertyType.CASA,
    precioNoche: 10000 as any,
    porcentajeSena: 30 as any,
    limiteMesesReserva: 6,
    propietarioId: 1,
  };

  beforeEach(async () => {
    propertyRepo = { findOne: jest.fn().mockResolvedValue(mockProperty) };
    reservationRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getDataSourceToken(), useValue: { transaction: jest.fn() } },
        { provide: getRepositoryToken(Reservation), useValue: reservationRepo },
        { provide: getRepositoryToken(Property), useValue: propertyRepo },
        { provide: getRepositoryToken(Cliente), useValue: {} },
        { provide: getRepositoryToken(Payment), useValue: {} },
        { provide: getRepositoryToken(Cancellation), useValue: {} },
        { provide: MailService, useValue: { sendReservationConfirmation: jest.fn() } },
      ],
    }).compile();

    service = module.get(ReservationsService);
  });

  describe('simulate', () => {
    it('calcula noches, importe total y sena correctamente', async () => {
      const desde = toDateStr(addDays(10));
      const hasta = toDateStr(addDays(15));
      const result = await service.simulate(1, desde, hasta);
      expect(result.noches).toBe(5);
      expect(result.importeTotal).toBe(50000);
      expect(result.importeSena).toBe(15000);
    });

    it('rechaza fechas invertidas (salida antes o igual a entrada)', async () => {
      const fecha = toDateStr(addDays(10));
      await expect(service.simulate(1, fecha, fecha)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza reservas mas alla del limite de meses de la propiedad', async () => {
      const desde = toDateStr(addDays(400));
      const hasta = toDateStr(addDays(405));
      await expect(service.simulate(1, desde, hasta)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza si la propiedad no esta activa', async () => {
      propertyRepo.findOne.mockResolvedValueOnce({
        ...mockProperty,
        estado: PropertyStatus.INACTIVA,
      });
      const desde = toDateStr(addDays(10));
      const hasta = toDateStr(addDays(12));
      await expect(service.simulate(1, desde, hasta)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel - reglas de ventana de 72 horas', () => {
    const clienteUser = { sub: 5, email: 'c@test.com', role: Role.CLIENTE } as any;

    function buildReservation(fechaDesdeOffsetDays: number, estado = ReservationStatus.CONFIRMED) {
      return {
        id: 1,
        clienteId: 5,
        estado,
        fechaDesde: toDateStr(addDays(fechaDesdeOffsetDays)),
        fechaHasta: toDateStr(addDays(fechaDesdeOffsetDays + 3)),
        pagos: [],
        property: { propietarioId: 1 },
      } as any;
    }

    it('permite cancelar con mas de 72hs de anticipacion sin causa excepcional', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(buildReservation(10));
      // @ts-expect-error acceso a dependencias privadas para el test
      service['cancellationRepo'] = { create: (x: any) => x, save: jest.fn() };
      // @ts-expect-error
      service['dataSource'] = { transaction: (fn: any) => fn({ getRepository: () => ({ save: jest.fn() }) }) };
      // @ts-expect-error
      service['clienteRepo'] = { findOne: jest.fn().mockResolvedValue({ nombre: 'A', apellido: 'B' }) };

      const result = await service.cancel(1, { motivo: 'No puedo viajar' }, clienteUser);
      expect(result).toBeDefined();
    });

    it('rechaza cancelar dentro de las 72hs sin causa excepcional', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(buildReservation(1));
      await expect(
        service.cancel(1, { motivo: 'Arrepentimiento' }, clienteUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza cancelar una reserva que ya comenzo', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(buildReservation(-1));
      await expect(
        service.cancel(1, { motivo: 'Tarde', causaExcepcional: true }, clienteUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
