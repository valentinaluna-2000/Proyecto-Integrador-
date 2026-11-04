import source from './data-source';
import { createClient } from '@supabase/supabase-js';
import { required, env } from '../common/config';
import { DateTime } from 'luxon';
import {
  Propietario,
  Administrador,
  Cliente,
  Propiedad,
  ImagenPropiedad,
  Reserva,
  Pago,
  Cancelacion,
  PeriodoBloqueado,
} from './entities';
import { quote } from '../common/domain';
import { ensureStorage } from './storage-init';
import { ensureDemoCoverage } from './seed-coverage';
export function isValidDemoIdentity(
  user: { email?: string | null; app_metadata?: Record<string, unknown> } | null | undefined,
  email: string,
) {
  return user?.email?.toLowerCase() === email && user.app_metadata?.rentify_demo === true;
}
export async function runSeed() {
  if (env('NODE_ENV') !== 'development')
    throw new Error('El seed se permite únicamente en desarrollo.');
  const adminEmail = required('DEMO_ADMIN_EMAIL').toLowerCase(),
    adminPassword = required('DEMO_ADMIN_PASSWORD'),
    clientEmail = required('DEMO_CLIENT_EMAIL').toLowerCase(),
    clientPassword = required('DEMO_CLIENT_PASSWORD');
  if (adminEmail === clientEmail)
    throw new Error('Usá emails distintos para administrador y cliente demo.');
  if (
    !/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(adminPassword) ||
    !/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(clientPassword)
  )
    throw new Error('Las contraseñas demo deben cumplir la política.');
  await source.initialize();
  const lock = source.createQueryRunner();
  try {
    await lock.connect();
    await lock.query('SELECT pg_advisory_lock(72639401)');
    await source.runMigrations();
    const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ensureAuth = async (email: string, password: string) => {
      // Reuse linked identities, or a marked demo identity left by an interrupted seed.
      const existing =
        (await source.getRepository(Administrador).findOneBy({ email })) ||
        (await source.getRepository(Cliente).findOneBy({ email }));
      if (existing) {
        const { data, error } = await supabase.auth.admin.getUserById(existing.auth_user_id);
        if (error || !isValidDemoIdentity(data.user, email))
          throw new Error(
            `El perfil local demo para ${email} no coincide con una identidad demo válida de Supabase Auth. Corregí la inconsistencia sin borrar datos.`,
          );
        return existing.auth_user_id;
      }
      for (let page = 1; ; page++) {
        const { data: pageData, error: listError } = await supabase.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (listError) throw new Error('No se pudieron consultar las identidades demo.');
        const match = pageData.users.find((user) => user.email?.toLowerCase() === email);
        if (match) {
          if (match.app_metadata?.rentify_demo !== true)
            throw new Error('El email demo ya pertenece a una cuenta ajena al seed. Elegí otro.');
          return match.id;
        }
        if (pageData.users.length < 1000) break;
      }
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { rentify_demo: true },
      });
      if (error || !data.user)
        throw new Error(
          'No se pudo crear el usuario demo; revisá el email y la configuración de Supabase.',
        );
      return data.user.id;
    };
    const adminId = await ensureAuth(adminEmail, adminPassword),
      clientId = await ensureAuth(clientEmail, clientPassword);
    await ensureStorage();
    await source.transaction(async (tx) => {
      let owner = await tx.getRepository(Propietario).findOneBy({ documento: 'DEMO-RENTIFY-001' });
      if (!owner)
        owner = await tx.save(Propietario, {
          tipo_titular: 'empresa',
          nombre: 'Rentify Demo',
          documento: 'DEMO-RENTIFY-001',
          direccion: 'Córdoba, Argentina',
          telefono: '+543510000000',
          email: adminEmail,
        });
      let admin = await tx.getRepository(Administrador).findOneBy({ auth_user_id: adminId });
      if (!admin)
        admin = await tx.save(Administrador, {
          auth_user_id: adminId,
          propietario_id: owner.id,
          nombre: 'Administración',
          apellido: 'Demo',
          email: adminEmail,
          rol: 'titular',
        });
      let client = await tx.getRepository(Cliente).findOneBy({ auth_user_id: clientId });
      if (!client)
        client = await tx.save(Cliente, {
          auth_user_id: clientId,
          nombre: 'Cliente',
          apellido: 'Demo',
          documento: 'DEMO-CLIENTE-001',
          email: clientEmail,
          telefono: '+543511111111',
          fecha_nacimiento: '1995-06-15',
        });
      const demo = [
        {
          nombre: 'Refugio de las Sierras',
          tipo: 'cabaña',
          direccion: 'Villa General Belgrano, Córdoba',
          latitud: '-31.9786',
          longitud: '-64.5586',
          precio_noche: '72000.00',
          capacidad: 4,
          porcentaje_sena: '30.00',
          photo: 'photo-1449158743715-0a90ebb6d2d8',
        },
        {
          nombre: 'Casa del Lago',
          tipo: 'casa',
          direccion: 'Villa Carlos Paz, Córdoba',
          latitud: '-31.4208',
          longitud: '-64.4992',
          precio_noche: '110000.00',
          capacidad: 6,
          porcentaje_sena: '40.00',
          photo: 'photo-1564013799919-ab600027ffc6',
        },
        {
          nombre: 'Balcón de Palermo',
          tipo: 'departamento',
          direccion: 'Palermo, Buenos Aires',
          latitud: '-34.5889',
          longitud: '-58.4306',
          precio_noche: '65000.00',
          capacidad: 2,
          porcentaje_sena: '25.00',
          photo: 'photo-1522708323590-d24dbb6b0267',
        },
        {
          nombre: 'Entre Viñedos',
          tipo: 'quinta',
          direccion: 'Luján de Cuyo, Mendoza',
          latitud: '-33.0352',
          longitud: '-68.8797',
          precio_noche: '155000.00',
          capacidad: 8,
          porcentaje_sena: '50.00',
          photo: 'photo-1613490493576-7fde63acd811',
        },
        {
          nombre: 'Bosque y Montaña',
          tipo: 'cabaña',
          direccion: 'San Carlos de Bariloche, Río Negro',
          latitud: '-41.1335',
          longitud: '-71.3103',
          precio_noche: '92000.00',
          capacidad: 4,
          porcentaje_sena: '30.00',
          photo: 'photo-1510798831971-661eb04b3739',
        },
        {
          nombre: 'Brisa del Mar',
          tipo: 'departamento',
          direccion: 'Mar del Plata, Buenos Aires',
          latitud: '-38.0055',
          longitud: '-57.5426',
          precio_noche: '58000.00',
          capacidad: 3,
          porcentaje_sena: '35.00',
          photo: 'photo-1502672260266-1c1ef2d93688',
        },
      ];
      for (const [index, item] of demo.entries()) {
        if (
          await tx
            .getRepository(Propiedad)
            .existsBy({ nombre: item.nombre, propietario_id: owner.id })
        )
          continue;
        const { photo, ...fields } = item;
        const p = await tx.save(Propiedad, {
          ...fields,
          propietario_id: owner.id,
          descripcion:
            'Un espacio cálido y equipado para disfrutar una estadía inolvidable. Ambientes luminosos, cocina completa, ropa de cama y conexión Wi-Fi. Descubrí los paisajes y sabores de la región con la comodidad de sentirte en casa.',
          cantidad_habitaciones: Math.ceil(item.capacidad / 2),
          cantidad_banos: item.capacidad > 4 ? 2 : 1,
          hora_checkin: '15:00',
          hora_checkout: '10:00',
          acepta_mascotas: index % 2 === 0,
          acepta_menores: index !== 2,
          limite_meses_reserva: 12,
          estado: 'ACTIVA',
        });
        await tx.save(ImagenPropiedad, {
          propiedad_id: p.id,
          url: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=85`,
          orden: 0,
          storage_path: null,
        });
        const from = DateTime.now()
            .plus({ days: 7 + index * 3 })
            .toISODate()!,
          to = DateTime.fromISO(from).plus({ days: 3 }).toISODate()!;
        const amounts = quote(from, to, p.precio_noche, p.porcentaje_sena);
        const r = await tx.save(Reserva, {
          propiedad_id: p.id,
          cliente_id: client.id,
          fecha_desde: from,
          fecha_hasta: to,
          cantidad_huespedes: 2,
          fecha_creacion: new Date(),
          fecha_vencimiento_temporal: new Date(Date.now() + 90 * 60000),
          estado: index === 3 ? 'CANCELADA' : 'CONFIRMADA',
          importe_total: amounts.importe_total,
          importe_sena: amounts.importe_sena,
        });
        await tx.save(Pago, {
          reserva_id: r.id,
          monto: r.importe_sena,
          fecha: new Date(),
          estado: 'APROBADO',
          id_transaccion_externa: `DEMO-${r.id}`,
        });
        if (index === 3)
          await tx.save(Cancelacion, {
            reserva_id: r.id,
            administrador_id: admin.id,
            cliente_id: null,
            tipo_usuario: 'ADMINISTRADOR',
            fecha: new Date(),
            motivo: 'Cambio de planes de la demostración',
            es_excepcional: false,
            requiere_reintegro: true,
          });
        await tx.save(PeriodoBloqueado, {
          propiedad_id: p.id,
          fecha_desde: DateTime.now().plus({ days: 45 }).toISODate()!,
          fecha_hasta: DateTime.now().plus({ days: 48 }).toISODate()!,
          motivo: 'Mantenimiento programado',
        });
      }
      await ensureDemoCoverage(tx, owner.id, client.id);
    });
    console.log(
      'Seed completo: propietario, administrador, cliente, seis propiedades, reservas, pagos y bloqueos. Las credenciales son las configuradas en .env.',
    );
  } finally {
    await lock.query('SELECT pg_advisory_unlock(72639401)').catch(() => undefined);
    await lock.release();
    await source.destroy();
  }
}
if (require.main === module)
  runSeed().catch(() => {
    console.error('Seed fallido: revisá la configuración demo y conectividad.');
    process.exitCode = 1;
  });
