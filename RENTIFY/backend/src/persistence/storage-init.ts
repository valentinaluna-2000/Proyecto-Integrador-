import { createClient } from '@supabase/supabase-js';
import { env, required } from '../common/config';

export async function ensureStorage() {
  const client = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const name = env('SUPABASE_STORAGE_BUCKET', 'property-images');
  let result = await client.storage.getBucket(name);
  if (result.error && String(result.error.statusCode) === '404') {
    await client.storage.createBucket(name, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png'],
    });
    result = await client.storage.getBucket(name);
  }
  if (result.error || !result.data?.public)
    throw new Error('Revisá acceso a Storage y que el bucket configurado sea público.');
  console.log('Storage: bucket disponible; se conservó su contenido y configuración.');
}
