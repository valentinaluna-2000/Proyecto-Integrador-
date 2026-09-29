import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const calendar = require('../out-tsc/app/app/calendar-domain.js');
const { synchronizeAuthSession } = require('../out-tsc/app/app/auth-session.js');

const periods = [
  { fecha_desde: '2026-10-10', fecha_hasta: '2026-10-13', tipo: 'RESERVADA' },
  { fecha_desde: '2026-10-18', fecha_hasta: '2026-10-20', tipo: 'BLOQUEADA' },
];
test('el calendario deshabilita pasado, reservas, bloqueos y permite límites [desde,hasta)', () => {
  assert.equal(calendar.isStartSelectable('2026-09-29', '2026-09-30', 3, periods), false);
  assert.equal(calendar.isStartSelectable('2026-10-10', '2026-09-30', 3, periods), false);
  assert.equal(calendar.isStartSelectable('2026-10-18', '2026-09-30', 3, periods), false);
  assert.equal(calendar.isStartSelectable('2026-10-13', '2026-09-30', 3, periods), true);
  assert.equal(calendar.isEndSelectable('2026-10-08', '2026-10-10', '2026-09-30', 3, periods), true);
  assert.equal(calendar.isEndSelectable('2026-10-08', '2026-10-11', '2026-09-30', 3, periods), false);
  assert.equal(calendar.isEndSelectable('2026-10-16', '2026-10-18', '2026-09-30', 3, periods), true);
  const backendPeriods = [{ fecha_desde: '2026-10-10', fecha_hasta: '2026-10-13', tipo: 'RESERVADA' }];
  assert.equal(calendar.isStartSelectable('2026-10-14', '2026-09-30', 3, backendPeriods), true);
});
test('el ingreso al final de un mes conserva egresos válidos al navegar al mes siguiente', () => {
  const today = '2026-09-29';
  const blocked = [{ fecha_desde: '2026-10-05', fecha_hasta: '2026-10-07', tipo: 'BLOQUEADA' }];
  const start = calendar.selectCalendarDay({ from: '', to: '' }, '2026-09-30', today, 3, blocked);
  assert.deepEqual(start, { from: '2026-09-30', to: '' });
  assert.equal(calendar.canNavigateMonth('2026-09', 1, today, 3), true);
  assert.equal(calendar.isEndSelectable(start.from, '2026-10-01', today, 3, blocked), true);
  assert.deepEqual(
    calendar.selectCalendarDay(start, '2026-10-01', today, 3, blocked),
    { from: '2026-09-30', to: '2026-10-01' },
  );
});
test('el rango que cruza un bloqueo se rechaza y el checkout al comienzo del bloqueo es válido', () => {
  const periods = [{ fecha_desde: '2026-10-05', fecha_hasta: '2026-10-07', tipo: 'BLOQUEADA' }];
  assert.equal(calendar.isEndSelectable('2026-09-30', '2026-10-05', '2026-09-29', 3, periods), true);
  assert.equal(calendar.isEndSelectable('2026-09-30', '2026-10-06', '2026-09-29', 3, periods), false);
  assert.deepEqual(
    calendar.selectCalendarDay({ from: '2026-09-30', to: '' }, '2026-10-06', '2026-09-29', 3, periods),
    { from: '2026-09-30', to: '' },
  );
});
test('la selección natural permite reemplazar el ingreso sin recargar disponibilidad', () => {
  const today = '2026-10-01';
  const blocked = [{ fecha_desde: '2026-10-08', fecha_hasta: '2026-10-09', tipo: 'BLOQUEADA' }];
  const empty = { from: '', to: '' };
  const start = calendar.selectCalendarDay(empty, '2026-10-10', today, 3, blocked);
  assert.deepEqual(start, { from: '2026-10-10', to: '' });
  const completed = calendar.selectCalendarDay(start, '2026-10-14', today, 3, blocked);
  assert.deepEqual(completed, { from: '2026-10-10', to: '2026-10-14' });
  assert.deepEqual(
    calendar.selectCalendarDay(start, '2026-10-07', today, 3, blocked),
    { from: '2026-10-07', to: '' },
  );
  assert.deepEqual(
    calendar.selectCalendarDay(start, '2026-10-08', today, 3, blocked),
    start,
  );
  assert.deepEqual(
    calendar.selectCalendarDay(completed, '2026-10-20', today, 3, blocked),
    { from: '2026-10-20', to: '' },
  );
  assert.deepEqual(
    calendar.selectCalendarDay({ from: '2026-11-10', to: '' }, '2026-10-20', today, 3, blocked),
    { from: '2026-10-20', to: '' },
  );
  assert.deepEqual(calendar.selectCalendarDay(start, '2026-10-10', today, 3, blocked), empty);
  assert.deepEqual(calendar.selectCalendarDay(empty, '2026-09-30', today, 3, blocked), empty);
});
test('la navegación respeta el primer mes útil y el límite de reserva', () => {
  assert.equal(calendar.canNavigateMonth('2026-09', -1, '2026-09-29', 2), false);
  assert.equal(calendar.canNavigateMonth('2026-10', 1, '2026-09-29', 2), true);
  assert.equal(calendar.canNavigateMonth('2026-11', 1, '2026-09-29', 2), false);
});
test('la sincronización posterior a cambio de contraseña conserva token renovado y perfil', async () => {
  let refreshed = 0;
  const client = {
    auth: {
      refreshSession: async () => ({ data: { session: { access_token: 'nuevo-token' } }, error: null }),
      getSession: async () => ({ data: { session: { access_token: 'nuevo-token' } } }),
    },
  };
  const profile = await synchronizeAuthSession(client, async (token) => {
    refreshed++;
    assert.equal(token, 'nuevo-token');
    return { id: 1, role: 'CLIENTE' };
  }, true);
  assert.deepEqual(profile, { id: 1, role: 'CLIENTE' });
  assert.equal(refreshed, 1);
});
test('Inicio, catálogo y recuperación usan rutas y flujos distintos', () => {
  const routes = readFileSync(new URL('../src/app/routes.ts', import.meta.url), 'utf8');
  const authPage = readFileSync(new URL('../src/app/auth-pages.ts', import.meta.url), 'utf8');
  assert.match(routes, /path: '', loadComponent: \(\) => import\('\.\/home'\)/);
  assert.match(routes, /path: 'propiedades', loadComponent: \(\) => import\('\.\/catalog'\)/);
  assert.match(authPage, /this\.mode === 'restablecer'/);
  assert.match(authPage, /passwordUpdated: 1/);
});
