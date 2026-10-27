import { BadRequestException } from '@nestjs/common';
import { Actor, Rol } from '../src/common/domain';
import { ProfileDto } from '../src/common/dtos';
import { UsersService } from '../src/users/users.service';

function setup() {
  const repository = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
  const db = { getRepository: jest.fn(() => repository) };
  return { repository, service: new UsersService(db as any) };
}

describe('Perfil de usuario', () => {
  test('me devuelve solo los campos de perfil necesarios', async () => {
    const { service } = setup();
    const actor = {
      id: 2,
      role: Rol.CLIENTE,
      nombre: 'Ana',
      apellido: 'García',
      email: 'ana@example.com',
      telefono: '+543511234567',
      auth_user_id: 'internal-uuid',
      documento: '12345678',
      fecha_nacimiento: '1990-01-01',
    } as Actor & { documento: string; fecha_nacimiento: string };

    await expect(service.me(actor)).resolves.toEqual({
      id: 2,
      role: Rol.CLIENTE,
      nombre: 'Ana',
      apellido: 'García',
      email: 'ana@example.com',
      telefono: '+543511234567',
    });
  });

  test('rechaza una actualización vacía del cliente', async () => {
    const { repository, service } = setup();
    const actor = { id: 2, role: Rol.CLIENTE } as Actor;

    await expect(
      service.update(actor, {} as ProfileDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  test('rechaza el teléfono en una actualización del administrador', async () => {
    const { repository, service } = setup();
    const actor = { id: 3, role: Rol.ADMINISTRADOR } as Actor;

    await expect(
      service.update(actor, { telefono: '+543511234567' } as ProfileDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
