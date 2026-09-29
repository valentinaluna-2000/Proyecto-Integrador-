import { AuthService, GENERIC, RECOVERY, VERIFICATION } from '../src/auth/auth.service';
import { AuthGuard, RolesGuard } from '../src/auth/security';
import { Cliente, Administrador, Outbox } from '../src/persistence/entities';
import { RegisterDto } from '../src/common/dtos';
import { Rol } from '../src/common/domain';
import { SupabaseAuthAdapter } from '../src/integrations/supabase/supabase.adapter';
const dto: RegisterDto = {
  nombre: 'Ana',
  apellido: 'García',
  documento: '12345678',
  telefono: '+543511234567',
  email: 'ana@example.com',
  fecha_nacimiento: '1990-01-01',
  password: 'Password123',
  confirmar_password: 'Password123',
};
function setup() {
  const repo = {
    exists: jest.fn().mockResolvedValue(false),
    existsBy: jest.fn().mockResolvedValue(false),
    findOneBy: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
  };
  const tx = { query: jest.fn(), save: jest.fn(), getRepository: jest.fn(() => repo) };
  const db = { getRepository: jest.fn(() => repo), transaction: jest.fn((fn) => fn(tx)) };
  const auth = {
    signup: jest
      .fn()
      .mockResolvedValue({ id: 'uuid', actionUrl: 'https://auth.example/verify?token=secret' }),
    deleteUser: jest.fn(),
    isVerified: jest.fn().mockResolvedValue(false),
    verification: jest
      .fn()
      .mockResolvedValue({ id: 'uuid', actionUrl: 'https://auth.example/verify' }),
    recovery: jest
      .fn()
      .mockResolvedValue({ id: 'uuid', actionUrl: 'https://auth.example/recover' }),
  };
  return { repo, tx, db, auth, service: new AuthService(db as any, auth as any) };
}
describe('Registro y recovery', () => {
  test('crea usuario no verificado y perfil sin password; outbox para Kafka', async () => {
    const s = setup();
    await s.service.register(dto);
    expect(s.auth.signup).toHaveBeenCalledWith(dto.email, dto.password);
    expect(s.tx.save).toHaveBeenCalledWith(
      Cliente,
      expect.objectContaining({ auth_user_id: 'uuid' }),
    );
    const [, saved] = s.tx.save.mock.calls[0];
    expect(saved).not.toHaveProperty('password');
    const event = s.tx.save.mock.calls.find((c) => c[0] === Outbox)![1];
    expect(event.topic).toBe(VERIFICATION);
    expect(event.payload).toMatchObject({
      type: 'EMAIL_VERIFICATION',
      version: 1,
      recipient: dto.email,
    });
    expect(JSON.stringify(event)).not.toContain(dto.password);
  });
  test('rechaza duplicados antes de crear Auth', async () => {
    const s = setup();
    s.repo.exists.mockResolvedValue(true);
    await expect(s.service.register(dto)).rejects.toThrow();
    expect(s.auth.signup).not.toHaveBeenCalled();
  });
  test('rechaza confirmación distinta', async () => {
    const s = setup();
    await expect(s.service.register({ ...dto, confirmar_password: 'otro' })).rejects.toThrow();
  });
  test('revierte Auth cuando falla la persistencia', async () => {
    const s = setup();
    s.tx.save.mockRejectedValueOnce(new Error());
    await expect(s.service.register(dto)).rejects.toThrow();
    expect(s.auth.deleteUser).toHaveBeenCalledWith('uuid');
  });
  test('recovery publica evento y conserva respuesta genérica', async () => {
    const s = setup();
    s.repo.findOneBy.mockResolvedValue({ nombre: 'Ana', auth_user_id: 'uuid' });
    expect(await s.service.sendLink(dto.email, true)).toEqual({ message: GENERIC });
    expect(s.repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: RECOVERY,
        payload: expect.objectContaining({ type: 'PASSWORD_RECOVERY' }),
      }),
    );
  });
  test('correo desconocido y conocido tienen respuesta idéntica', async () => {
    const s = setup();
    expect(await s.service.sendLink('unknown@example.com', true)).toEqual({ message: GENERIC });
    expect(s.auth.recovery).not.toHaveBeenCalled();
  });
  test('reenvío usa enlace de verificación', async () => {
    const s = setup();
    s.repo.findOneBy.mockResolvedValue({ nombre: 'Ana', auth_user_id: 'uuid' });
    await s.service.sendLink(dto.email, false);
    expect(s.auth.verification).toHaveBeenCalledWith(dto.email);
    expect(s.repo.save).toHaveBeenCalledWith(expect.objectContaining({ topic: VERIFICATION }));
  });
});
describe('Autorización JWT Supabase', () => {
  function setupGuard(verified: boolean, role = Rol.CLIENTE) {
    const auth = { identity: jest.fn().mockResolvedValue({ id: 'subject', verified }) };
    const req: any = { headers: { authorization: 'Bearer signed-jwt' } };
    const db = {
      getRepository: (entity: any) => ({
        findOneBy: jest
          .fn()
          .mockResolvedValue(
            entity === (role === Rol.CLIENTE ? Cliente : Administrador)
              ? { id: 3, auth_user_id: 'subject', propietario_id: 7 }
              : null,
          ),
      }),
    };
    const ctx: any = { switchToHttp: () => ({ getRequest: () => req }) };
    return { guard: new AuthGuard(auth as any, db as any), ctx, req, auth };
  }
  test('visitante no puede reservar', async () => {
    const s = setupGuard(true);
    s.req.headers = {};
    await expect(s.guard.canActivate(s.ctx)).rejects.toThrow('Iniciá sesión');
  });
  test('cuenta sin verificar no accede', async () => {
    const s = setupGuard(false);
    await expect(s.guard.canActivate(s.ctx)).rejects.toThrow('verificar');
  });
  test('cuenta verificada restaura perfil por sub', async () => {
    const s = setupGuard(true);
    expect(await s.guard.canActivate(s.ctx)).toBe(true);
    expect(s.req.user.role).toBe(Rol.CLIENTE);
    expect(s.auth.identity).toHaveBeenCalledWith('signed-jwt');
  });
  test('administrador obtiene propietario', async () => {
    const s = setupGuard(true, Rol.ADMINISTRADOR);
    await s.guard.canActivate(s.ctx);
    expect(s.req.user.propietario_id).toBe(7);
  });
  test('cliente no accede a rutas admin', () => {
    const guard = new RolesGuard({ getAllAndOverride: () => [Rol.ADMINISTRADOR] } as any);
    expect(() =>
      guard.canActivate({
        getHandler: () => null,
        getClass: () => null,
        switchToHttp: () => ({ getRequest: () => ({ user: { role: Rol.CLIENTE } }) }),
      } as any),
    ).toThrow();
  });
});
describe('Adaptador Supabase', () => {
  test('generateLink signup usa API oficial y no confirma cuenta', async () => {
    const createUser = jest.fn().mockResolvedValue({ data: { user: { id: 'user' } } });
    const generateLink = jest
      .fn()
      .mockResolvedValue({
        data: { user: { id: 'user' }, properties: { action_link: 'https://auth.example/verify' } },
      });
    const adapter = Object.create(SupabaseAuthAdapter.prototype);
    adapter.client = { auth: { admin: { generateLink, createUser } } };
    process.env.FRONTEND_URL = 'http://localhost:4200';
    expect(await adapter.signup(dto.email, dto.password)).toEqual({
      id: 'user',
      actionUrl: expect.stringContaining('https://auth.example/verify'),
    });
    expect(createUser).toHaveBeenCalledWith({
      email: dto.email,
      password: dto.password,
      email_confirm: false,
    });
    expect(generateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'signup', email: dto.email }),
    );
    expect(generateLink.mock.calls[0][0]).not.toHaveProperty('email_confirm');
  });
});
