import { DateTime } from 'luxon';
import { quote, dates, validateStay, validateCancellation, Rol, Actor } from '../src/common/domain';
import { occupancy } from '../src/reports/reports.service';
describe('Reglas de reservas y dinero', () => {
  test('calcula noches, total y seña con precisión decimal', () => {
    expect(quote('2027-01-01', '2027-01-04', '100.10', '30')).toEqual({
      cantidad_noches: 3,
      importe_total: '300.30',
      importe_sena: '90.09',
    });
  });
  test('redondea medio centavo de seña', () =>
    expect(quote('2027-01-01', '2027-01-02', '10.05', '10').importe_sena).toBe('1.01'));
  test.each([
    ['2027-01-02', '2027-01-01'],
    ['2027-02-30', '2027-03-04'],
    ['2027-01-01', '2027-01-01'],
  ])('rechaza fechas inválidas %s %s', (a, b) => expect(() => dates(a, b)).toThrow());
  test('valida capacidad y anticipación', () => {
    const now = DateTime.fromISO('2027-01-01');
    expect(() =>
      validateStay({ capacidad: 2, limite_meses_reserva: 2 }, '2027-01-03', '2027-01-04', 3, now),
    ).toThrow();
    expect(() =>
      validateStay({ capacidad: 2, limite_meses_reserva: 2 }, '2027-03-03', '2027-03-04', 2, now),
    ).toThrow();
    expect(() =>
      validateStay({ capacidad: 2, limite_meses_reserva: 2 }, '2027-01-03', '2027-01-04', 2, now),
    ).not.toThrow();
  });
  const actor = { id: 1, role: Rol.CLIENTE } as Actor;
  test('cancelación respeta 72 horas y zona Córdoba', () => {
    const now = DateTime.fromISO('2027-01-01T15:00:00', { zone: 'America/Argentina/Cordoba' });
    expect(() => validateCancellation('2027-01-04', '15:00:00', false, actor, now)).not.toThrow();
    expect(() => validateCancellation('2027-01-04', '14:59:00', false, actor, now)).toThrow();
    expect(() => validateCancellation('2027-01-02', '15:00:00', true, actor, now)).toThrow();
    expect(() =>
      validateCancellation(
        '2027-01-02',
        '15:00:00',
        true,
        { ...actor, role: Rol.ADMINISTRADOR },
        now,
      ),
    ).not.toThrow();
    expect(() =>
      validateCancellation(
        '2027-01-01',
        '15:00:00',
        true,
        { ...actor, role: Rol.ADMINISTRADOR },
        now,
      ),
    ).toThrow();
  });
  test('ocupación es noches confirmadas sobre inventario', () => {
    expect(occupancy(3, 12)).toBe(25);
    expect(occupancy(0, 0)).toBe(0);
  });
});
