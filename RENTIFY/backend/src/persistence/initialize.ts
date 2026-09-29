import 'reflect-metadata';
import { env, required } from '../common/config';
import { ensureStorage } from './storage-init';

async function initialize() {
  for (const key of [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_USER',
    'SMTP_APP_PASSWORD',
    'SMTP_FROM',
  ])
    required(key);
  if (env('NODE_ENV') === 'production') required('MERCADOPAGO_WEBHOOK_SECRET');
  const source = (await import('./data-source')).default;
  await source.initialize();
  const lock = source.createQueryRunner();
  try {
    await lock.connect();
    await lock.query('SELECT pg_advisory_lock(72639401)');
    const applied = await source.runMigrations();
    console.log(`Migraciones: ${applied.length} aplicadas; esquema actualizado.`);
    await ensureStorage();
  } finally {
    await lock.query('SELECT pg_advisory_unlock(72639401)').catch(() => undefined);
    await lock.release();
    await source.destroy();
  }
}
initialize().catch(() => {
  console.error(
    'Inicialización fallida: revisá variables obligatorias, PostgreSQL, migraciones y permisos de Storage. No se iniciará la API.',
  );
  process.exitCode = 1;
});
