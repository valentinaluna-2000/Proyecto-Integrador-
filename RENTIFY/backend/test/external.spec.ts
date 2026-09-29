import { OpenMeteoWeatherProvider } from '../src/integrations/weather/open-meteo.provider';
import { DateTime } from 'luxon';
describe('Clima tolerante a fallas', () => {
  const from = DateTime.now().plus({ days: 1 }).toISODate()!,
    to = DateTime.now().plus({ days: 3 }).toISODate()!;
  afterEach(() => jest.restoreAllMocks());
  test('falla externa no bloquea reserva y entrega mensaje', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('timeout'));
    const result: any = await new OpenMeteoWeatherProvider().forecast('-31', '-64', from, to);
    expect(result.disponible).toBe(false);
    expect(result.message).toContain('temporalmente');
  });
  test('fuera de rango no consulta proveedor', async () => {
    const fetch = jest.spyOn(global, 'fetch');
    const result: any = await new OpenMeteoWeatherProvider().forecast(
      '-31',
      '-64',
      '2099-01-01',
      '2099-01-03',
    );
    expect(result.disponible).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  test('cache reduce consultas repetidas', async () => {
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => ({ daily: { time: [from] } }) } as Response);
    const provider = new OpenMeteoWeatherProvider();
    await provider.forecast('-31', '-64', from, to);
    await provider.forecast('-31', '-64', from, to);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
