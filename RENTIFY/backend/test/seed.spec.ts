import { isValidDemoIdentity } from '../src/persistence/seed';

describe('Identidades del seed demo', () => {
  test('acepta una identidad demo existente aunque se repita el seed', () => {
    expect(isValidDemoIdentity({ email: 'ADMIN@DEMO.TEST', app_metadata: { rentify_demo: true } }, 'admin@demo.test')).toBe(true);
  });
  test('rechaza identidad ausente, ajena o con email distinto sin borrar datos', () => {
    expect(isValidDemoIdentity(null, 'admin@demo.test')).toBe(false);
    expect(isValidDemoIdentity({ email: 'admin@demo.test', app_metadata: {} }, 'admin@demo.test')).toBe(false);
    expect(isValidDemoIdentity({ email: 'other@demo.test', app_metadata: { rentify_demo: true } }, 'admin@demo.test')).toBe(false);
  });
});
