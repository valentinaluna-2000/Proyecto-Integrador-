import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: process.env.RENTIFY_ENV_FILE || resolve(__dirname, '../../../.env'), quiet: true });
export const env = (key: string, fallback = '') => process.env[key] || fallback;
export function required(key: string): string {
  const value = env(key);
  if (!value) throw new Error(`Falta configurar ${key} en .env`);
  return value;
}
