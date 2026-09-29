import { createHmac } from 'crypto';
import { MercadoPagoPaymentGateway } from '../src/integrations/mercadopago/mercadopago.gateway';
import { PaymentsService } from '../src/payments/payments.service';
import { Reserva, Pago } from '../src/persistence/entities';
const reservation = {
  id: 1,
  propiedad_id: 4,
  importe_sena: '300.00',
  estado: 'TEMPORAL',
  fecha_vencimiento_temporal: new Date(Date.now() + 60000),
};
function setup(status = 'approved', existing?: unknown) {
  const tx = {
    query: jest.fn(),
    getRepository: (entity: any) => ({
      findOneByOrFail: jest.fn().mockResolvedValue(reservation),
      findOneBy: jest.fn().mockResolvedValue(entity === Pago ? existing : reservation),
    }),
    save: jest.fn(),
    update: jest.fn(),
  };
  const db = {
    getRepository: () => ({ findOneBy: jest.fn().mockResolvedValue(reservation) }),
    transaction: jest.fn((fn) => fn(tx)),
  };
  const gateway = {
    verifySignature: jest.fn(),
    payment: jest
      .fn()
      .mockResolvedValue({
        id: '123',
        external_reference: '1',
        status,
        transaction_amount: 300,
        currency_id: 'ARS',
        live_mode: false,
      }),
  };
  return { tx, gateway, service: new PaymentsService(db as any, gateway as any) };
}
describe('Mercado Pago TEST', () => {
  test('firma HMAC válida y firma inválida', () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 'test-secret';
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = createHmac('sha256', 'test-secret')
      .update(`id:123;request-id:request;ts:${ts};`)
      .digest('hex');
    const gateway = new MercadoPagoPaymentGateway();
    expect(() => gateway.verifySignature('123', `ts=${ts},v1=${sig}`, 'request')).not.toThrow();
    expect(() => gateway.verifySignature('124', `ts=${ts},v1=${sig}`, 'request')).toThrow();
    expect(() => gateway.verifySignature('123', 'garbage', 'request')).toThrow();
  });
  test('pago aprobado confirma reserva dentro de transacción', async () => {
    const s = setup();
    await s.service.webhook('123', 'sig', 'request');
    expect(s.tx.save).toHaveBeenCalledWith(Pago, expect.objectContaining({ estado: 'APROBADO' }));
    expect(s.tx.update).toHaveBeenCalledWith(Reserva, 1, { estado: 'CONFIRMADA' });
  });
  test('rechazado guarda pago y no confirma', async () => {
    const s = setup('rejected');
    await s.service.webhook('123', 'sig', 'request');
    expect(s.tx.save).toHaveBeenCalledWith(Pago, expect.objectContaining({ estado: 'RECHAZADO' }));
    expect(s.tx.update).not.toHaveBeenCalled();
  });
  test('pendiente no confirma', async () => {
    const s = setup('pending');
    await s.service.webhook('123', 'sig', 'request');
    expect(s.tx.update).not.toHaveBeenCalled();
  });
  test('webhook duplicado no inserta otro pago aprobado', async () => {
    const s = setup('approved', { estado: 'APROBADO' });
    await s.service.webhook('123', 'sig', 'request');
    expect(s.tx.save).not.toHaveBeenCalled();
  });
  test('no confía en monto ni pagos reales', async () => {
    const s = setup();
    s.gateway.payment.mockResolvedValueOnce({
      id: '123',
      external_reference: '1',
      status: 'approved',
      transaction_amount: 1,
      currency_id: 'ARS',
      live_mode: false,
    });
    await expect(s.service.webhook('123', 'sig', 'req')).rejects.toThrow('monto');
    s.gateway.payment.mockResolvedValueOnce({
      id: '123',
      external_reference: '1',
      status: 'approved',
      transaction_amount: 300,
      currency_id: 'ARS',
      live_mode: true,
    });
    await expect(s.service.webhook('123', 'sig', 'req')).rejects.toThrow('TEST');
  });
  test('pago tardío nunca reabre una reserva', async () => {
    const s = setup();
    s.tx.getRepository = () => ({
      findOneByOrFail: jest.fn().mockResolvedValue({ ...reservation, estado: 'VENCIDA' }),
      findOneBy: jest.fn().mockResolvedValue(null),
    });
    await s.service.webhook('123', 'sig', 'req');
    expect(s.tx.save).toHaveBeenCalled();
    expect(s.tx.update).not.toHaveBeenCalled();
  });
});
