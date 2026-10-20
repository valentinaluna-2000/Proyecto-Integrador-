import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { types } from 'pg';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';
import * as entities from '../src/persistence/entities';
import { Initial1780000000000 } from '../src/persistence/migrations/1780000000000-Initial';
import { ReservationsService } from '../src/reservations/reservations.service';
import { PropertiesService } from '../src/properties/properties.service';
import { AvailabilityService } from '../src/availability/availability.service';
import { CancellationsService } from '../src/cancellations/cancellations.service';
import { PaymentsService } from '../src/payments/payments.service';
import { ReportsService } from '../src/reports/reports.service';
import { Actor, Rol } from '../src/common/domain';
import { FiltersDto } from '../src/common/dtos';
import { env } from '../src/common/config';
import { ensureDemoCoverage } from '../src/persistence/seed-coverage';
types.setTypeParser(1082, (v) => v);
// TEST_DATABASE_URL must identify a disposable database named rentify_test*.
const url = env('TEST_DATABASE_URL');
const suite = url ? describe : describe.skip;
suite('PostgreSQL real: integridad, concurrencia y reportes', () => {
  let db: DataSource,
    service: ReservationsService,
    properties: PropertiesService,
    availability: AvailabilityService,
    cancellations: CancellationsService;
  let owner: number, propertyId: number, client: Actor, admin: Actor;
  const from = DateTime.now().plus({ days: 10 }).toISODate()!,
    to = DateTime.now().plus({ days: 13 }).toISODate()!;
  beforeAll(async () => {
    if (!/^\/rentify_test[a-z0-9_]*$/.test(new URL(url).pathname))
      throw new Error('Usá una base descartable llamada rentify_test*.');
    db = new DataSource({
      type: 'postgres',
      url,
      entities: Object.values(entities),
      migrations: [Initial1780000000000],
      synchronize: false,
    });
    await db.initialize();
    await db.query(
      `CREATE SCHEMA IF NOT EXISTS auth;CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF; END $$;`,
    );
    await db.runMigrations();
    service = new ReservationsService(db);
    properties = new PropertiesService(db, {} as any);
    availability = new AvailabilityService(db);
    cancellations = new CancellationsService(db);
  }, 30000);
  beforeEach(async () => {
    await db.query(
      'TRUNCATE propietarios,clientes,administradores,propiedades,imagenes_propiedad,reservas,pagos,cancelaciones,periodos_bloqueados,email_outbox,email_receipts RESTART IDENTITY CASCADE',
    );
    const uid = randomUUID(),
      aid = randomUUID();
    await db.query('INSERT INTO auth.users(id) VALUES($1),($2)', [uid, aid]);
    const p = await db.getRepository(entities.Propietario).save({
      tipo_titular: 'persona',
      nombre: 'Dueño',
      documento: '123',
      direccion: 'Córdoba',
      telefono: '12345678',
      email: 'owner@example.com',
    });
    owner = p.id;
    const c = await db.getRepository(entities.Cliente).save({
      auth_user_id: uid,
      nombre: 'Cliente',
      apellido: 'Test',
      documento: '12345678',
      email: 'client@example.com',
      telefono: '12345678',
      fecha_nacimiento: '1990-01-01',
    });
    client = { ...c, role: Rol.CLIENTE };
    const a = await db.getRepository(entities.Administrador).save({
      auth_user_id: aid,
      nombre: 'Admin',
      apellido: 'Test',
      email: 'admin@example.com',
      propietario_id: owner,
      rol: 'titular',
    });
    admin = { ...a, role: Rol.ADMINISTRADOR };
    const prop = await db.getRepository(entities.Propiedad).save({
      propietario_id: owner,
      nombre: 'Casa de prueba',
      tipo: 'casa',
      descripcion: 'Casa equipada para pruebas',
      direccion: 'Córdoba, Argentina',
      latitud: '-31.4',
      longitud: '-64.1',
      capacidad: 4,
      cantidad_habitaciones: 2,
      cantidad_banos: 1,
      hora_checkin: '15:00',
      hora_checkout: '10:00',
      acepta_mascotas: true,
      acepta_menores: true,
      limite_meses_reserva: 12,
      precio_noche: '100.10',
      porcentaje_sena: '30',
      estado: 'ACTIVA',
    });
    propertyId = prop.id;
  });
  test('seed complementario cubre estados, respeta bloqueos y no cambia datos al repetirse', async () => {
    const start = DateTime.now().plus({ days: 30 }).toISODate()!;
    await db
      .getRepository(entities.PeriodoBloqueado)
      .save({
        propiedad_id: propertyId,
        fecha_desde: start,
        fecha_hasta: DateTime.fromISO(start).plus({ days: 3 }).toISODate()!,
        motivo: 'Bloqueo existente',
      });
    await db.transaction((tx) => ensureDemoCoverage(tx, owner, client.id));
    const snapshot = async () =>
      Promise.all([
        db.getRepository(entities.Reserva).find({ order: { id: 'ASC' } }),
        db.getRepository(entities.Pago).find({ order: { id: 'ASC' } }),
        db.getRepository(entities.Cancelacion).find({ order: { id: 'ASC' } }),
        db.getRepository(entities.PeriodoBloqueado).find({ order: { id: 'ASC' } }),
      ]);
    const before = await snapshot();
    expect(before[0].map((r) => (r as entities.Reserva).estado).sort()).toEqual([
      'CANCELADA',
      'CONFIRMADA',
      'TEMPORAL',
      'VENCIDA',
    ]);
    expect(new Set(before[1].map((p) => (p as entities.Pago).estado))).toEqual(
      new Set(['APROBADO', 'PENDIENTE', 'RECHAZADO']),
    );
    expect(
      (before[0] as entities.Reserva[]).some((r) => r.fecha_hasta < DateTime.now().toISODate()!),
    ).toBe(true);
    expect(
      (before[0] as entities.Reserva[]).find((r) => r.estado === 'TEMPORAL')!.fecha_desde,
    ).not.toBe(start);
    expect((before[2][0] as entities.Cancelacion).cliente_id).toBe(client.id);
    await db.transaction((tx) => ensureDemoCoverage(tx, owner, client.id));
    expect(await snapshot()).toEqual(before);
  });
  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });
  const reserve = () =>
    service.create(client, {
      propiedad_id: propertyId,
      fecha_desde: from,
      fecha_hasta: to,
      cantidad_huespedes: 2,
    });
  test('dos solicitudes simultáneas: exactamente una reserva', async () => {
    const results = await Promise.allSettled([reserve(), reserve()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await db.getRepository(entities.Reserva).count()).toBe(1);
  });
  test('intervalos adyacentes son compatibles', async () => {
    await reserve();
    await expect(
      service.create(client, {
        propiedad_id: propertyId,
        fecha_desde: to,
        fecha_hasta: DateTime.fromISO(to).plus({ days: 2 }).toISODate()!,
        cantidad_huespedes: 2,
      }),
    ).resolves.toBeDefined();
  });
  test('exclusion constraint protege incluso inserciones directas', async () => {
    const r = await reserve();
    const { id: _id, ...copy } = r;
    await expect(db.getRepository(entities.Reserva).save(copy)).rejects.toMatchObject({
      driverError: expect.objectContaining({ code: '23P01' }),
    });
  });
  test('bloqueo y reserva simultáneos usan el mismo lock', async () => {
    const results = await Promise.allSettled([
      reserve(),
      properties.block(propertyId, admin, {
        fecha_desde: from,
        fecha_hasta: to,
        motivo: 'Mantenimiento',
      }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
  test('bloqueo existente impide reserva', async () => {
    await properties.block(propertyId, admin, {
      fecha_desde: from,
      fecha_hasta: to,
      motivo: 'Mantenimiento',
    });
    await expect(reserve()).rejects.toThrow('disponible');
  });
  test('vencimiento libera rango aunque job no se haya ejecutado', async () => {
    const r = await reserve();
    await db
      .getRepository(entities.Reserva)
      .update(r.id, { fecha_vencimiento_temporal: new Date(Date.now() - 1000) });
    expect((await availability.check(propertyId, from, to)).disponible).toBe(true);
    await reserve();
    expect((await db.getRepository(entities.Reserva).findOneByOrFail({ id: r.id })).estado).toBe(
      'VENCIDA',
    );
  });
  test('job de vencimiento idempotente', async () => {
    const r = await reserve();
    await db
      .getRepository(entities.Reserva)
      .update(r.id, { fecha_vencimiento_temporal: new Date(Date.now() - 1000) });
    await availability.expire();
    await availability.expire();
    expect((await db.getRepository(entities.Reserva).findOneByOrFail({ id: r.id })).estado).toBe(
      'VENCIDA',
    );
  });
  test('administrador no puede operar otro propietario', async () => {
    await expect(
      properties.update(propertyId, { ...admin, propietario_id: 999 }, { nombre: 'Ataque' }),
    ).rejects.toThrow();
  });
  test('visitante accede a catálogo sin datos privados', async () => {
    const results = await properties.list({ page: 1, limit: 12 } as FiltersDto);
    expect(results.total).toBe(1);
    expect(results.items).toHaveLength(1);
    expect(results.items[0]).not.toHaveProperty('cliente_id');
  });
  test('cancelación registra un solo actor y libera rango', async () => {
    const r = await reserve();
    const c = await cancellations.cancel(r.id, client, { motivo: 'Cambio de planes' });
    expect(c?.cliente_id).toBe(client.id);
    expect(c?.administrador_id).toBeNull();
    expect((await availability.check(propertyId, from, to)).disponible).toBe(true);
    await expect(
      db.getRepository(entities.Cancelacion).update(c!.id, { administrador_id: admin.id }),
    ).rejects.toMatchObject({ driverError: expect.objectContaining({ code: '23514' }) });
  });
  test('webhooks simultáneos se procesan una sola vez y reportes reflejan el pago', async () => {
    const r = await reserve();
    const gateway = {
      verifySignature: jest.fn(),
      payment: jest.fn().mockResolvedValue({
        id: '999',
        external_reference: String(r.id),
        status: 'approved',
        transaction_amount: 90.09,
        currency_id: 'ARS',
        live_mode: false,
      }),
    };
    const payments = new PaymentsService(db, gateway as any);
    await Promise.all([
      payments.webhook('999', 'sig', 'req'),
      payments.webhook('999', 'sig', 'req'),
    ]);
    expect(await db.getRepository(entities.Pago).count()).toBe(1);
    expect((await db.getRepository(entities.Reserva).findOneByOrFail({ id: r.id })).estado).toBe(
      'CONFIRMADA',
    );
    const report = await new ReportsService(db).report('performance', admin, {
      fecha_desde: DateTime.now().toISODate()!,
      fecha_hasta: to,
    });
    expect(report.resumen.ingresos).toBe('90.09');
    expect(report.resumen.noches_ocupadas).toBe(3);
    expect(report.resumen.reservas_confirmadas).toBe(1);
  });
});
