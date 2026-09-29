import { AvailabilityService } from '../src/availability/availability.service';

describe('Disponibilidad para calendario', () => {
  test('expone solo reservas confirmadas, temporales vigentes y bloqueos', async () => {
    const query = jest.fn().mockResolvedValue([
      { fecha_desde: '2026-10-10', fecha_hasta: '2026-10-13', tipo: 'RESERVADA' },
      { fecha_desde: '2026-10-18', fecha_hasta: '2026-10-20', tipo: 'BLOQUEADA' },
    ]);
    const db = {
      getRepository: () => ({ existsBy: jest.fn().mockResolvedValue(true) }),
      query,
    };
    const result = await new AvailabilityService(db as any).check(1, '2026-10-01', '2026-11-01');
    expect(result).toEqual({ disponible: false, periodos: expect.any(Array) });
    const statement = query.mock.calls[0][0] as string;
    expect(statement).toContain("estado='CONFIRMADA'");
    expect(statement).toContain("estado='TEMPORAL'");
    expect(statement).toContain('fecha_vencimiento_temporal>now()');
    expect(statement).not.toContain("estado='CANCELADA'");
    expect(statement).not.toContain("estado='VENCIDA'");
  });
});
