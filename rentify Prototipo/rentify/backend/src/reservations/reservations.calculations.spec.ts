import { diffInNights } from './reservations.service';

describe('diffInNights', () => {
  it('calcula correctamente la cantidad de noches entre dos fechas', () => {
    expect(diffInNights('2026-12-20', '2026-12-27')).toBe(7);
  });

  it('calcula 1 noche cuando la diferencia es de un dia', () => {
    expect(diffInNights('2026-01-01', '2026-01-02')).toBe(1);
  });

  it('funciona correctamente entre meses', () => {
    expect(diffInNights('2026-01-30', '2026-02-02')).toBe(3);
  });
});
