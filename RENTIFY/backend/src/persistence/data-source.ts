import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { types } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { rootCertificates } from 'tls';
import { env, required } from '../common/config';
import * as entities from './entities';
import { Initial1780000000000 } from './migrations/1780000000000-Initial';
types.setTypeParser(1082, (value) => value);
export function makeDataSource(url = required('DATABASE_URL')) {
  const parsed = new URL(url);
  // pg connection-string SSL parameters override driver TLS options. Use our explicit policy.
  for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert'])
    parsed.searchParams.delete(key);
  return new DataSource({
    type: 'postgres',
    url: parsed.toString(),
    ssl:
      env('DATABASE_SSL', 'true') === 'true'
        ? {
            rejectUnauthorized: true,
            ca: [
              ...rootCertificates,
              readFileSync(
                resolve(__dirname, '../../', env('DATABASE_SSL_CA_FILE', 'certs/supabase-ca.crt')),
                'utf8',
              ),
            ],
          }
        : false,
    entities: Object.values(entities),
    migrations: [Initial1780000000000],
    synchronize: false,
    logging: false,
    extra: { max: 10, connectionTimeoutMillis: 10000 },
  });
}
export default makeDataSource();
