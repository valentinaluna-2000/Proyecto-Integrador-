import { env } from '../common/config';

async function seed() {
  if (env('RUN_SEED', 'false') !== 'true') {
    console.log('Seed omitido (RUN_SEED no está habilitado).');
    return;
  }
  if (env('NODE_ENV') !== 'development') throw new Error('Seed requiere development.');
  await (await import('./seed')).runSeed();
}
seed().catch(() => {
  console.error('Seed fallido: revisá NODE_ENV, credenciales demo, PostgreSQL y Supabase Auth.');
  process.exitCode = 1;
});
