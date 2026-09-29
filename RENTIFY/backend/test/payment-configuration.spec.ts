import { MercadoPagoPaymentGateway } from '../src/integrations/mercadopago/mercadopago.gateway';

describe('Configuración segura de Mercado Pago', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
    jest.restoreAllMocks();
  });
  test('rechaza checkout y webhook si falta el secreto, sin llamadas externas', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = '';
    const fetch = jest.spyOn(global, 'fetch');
    const gateway = new MercadoPagoPaymentGateway();
    await expect(gateway.checkout(1, '100', 'Demo')).rejects.toThrow('firma del webhook');
    expect(() => gateway.verifySignature('123', 'ts=1,v1=abc', 'req')).toThrow('firma del webhook');
    expect(fetch).not.toHaveBeenCalled();
  });
  test('admite credencial de una cuenta de prueba verificada', async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-unit-test';
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ tags: ['test_user'] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: '123', live_mode: false })));
    await expect(new MercadoPagoPaymentGateway().payment('123')).resolves.toMatchObject({
      live_mode: false,
    });
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.mercadopago.com/users/me',
      'https://api.mercadopago.com/v1/payments/123',
    ]);
  });
  test('bloquea credenciales de una cuenta real antes de operar pagos', async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-unit-test';
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ tags: ['normal'] })));
    await expect(new MercadoPagoPaymentGateway().payment('123')).rejects.toThrow(
      'credenciales TEST',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
