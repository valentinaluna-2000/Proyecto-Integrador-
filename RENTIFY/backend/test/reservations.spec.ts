import { DataSource } from 'typeorm';
import { Actor, Rol } from '../src/common/domain';
import { PaginationDto } from '../src/common/dtos';
import { ReservationsService } from '../src/reservations/reservations.service';

describe('Paginación del listado de reservas', () => {
  const pagination = { page: 2, limit: 10 } as PaginationDto;

  test('limita las reservas del cliente y devuelve el total', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 11 }])
      .mockResolvedValueOnce([{ total: 24 }]);
    const service = new ReservationsService({ query } as unknown as DataSource);
    const client = { id: 7, role: Rol.CLIENTE } as Actor;

    await expect(service.list(client, pagination)).resolves.toEqual({
      items: [{ id: 11 }],
      total: 24,
      page: 2,
      limit: 10,
    });
    expect(query.mock.calls[0][0]).toContain('r.cliente_id=$1');
    expect(query.mock.calls[0][1]).toEqual([7, 10, 10]);
    expect(query.mock.calls[1][1]).toEqual([7]);
  });

  test('limita las reservas a las propiedades del administrador', async () => {
    const query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);
    const service = new ReservationsService({ query } as unknown as DataSource);
    const admin = { id: 3, propietario_id: 9, role: Rol.ADMINISTRADOR } as Actor;

    await expect(service.list(admin, pagination)).resolves.toMatchObject({
      items: [],
      total: 0,
      page: 2,
      limit: 10,
    });
    expect(query.mock.calls[0][0]).toContain('p.propietario_id=$1');
    expect(query.mock.calls[0][1]).toEqual([9, 10, 10]);
    expect(query.mock.calls[1][1]).toEqual([9]);
  });
});
