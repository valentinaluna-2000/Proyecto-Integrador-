import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { PaymentGateway, ExternalPayment } from '../../common/ports';
import { env, required } from '../../common/config';
@Injectable()
export class MercadoPagoPaymentGateway extends PaymentGateway {
  private verifiedTestToken?: string;
  private async token() {
    const token = required('MERCADOPAGO_ACCESS_TOKEN');
    if (token.startsWith('TEST-') || token === this.verifiedTestToken) return token;
    // New test sellers also use APP_USR credentials. Verify the account, not just its prefix.
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    const account = response.ok ? await response.json() : null;
    if (!Array.isArray(account?.tags) || !account.tags.includes('test_user'))
      throw new ServiceUnavailableException('Mercado Pago requiere credenciales TEST.');
    this.verifiedTestToken = token;
    return token;
  }
  private async request(path: string, body?: unknown) {
    const res = await fetch(`https://api.mercadopago.com${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${await this.token()}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': randomUUID(),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
      throw new ServiceUnavailableException('Mercado Pago no está disponible. Intentá nuevamente.');
    return res.json();
  }
  async checkout(id: number, amount: string, description: string) {
    if (!env('MERCADOPAGO_WEBHOOK_SECRET'))
      throw new ServiceUnavailableException(
        'Falta configurar la firma del webhook de Mercado Pago.',
      );
    const front = required('FRONTEND_URL');
    const data = await this.request('/checkout/preferences', {
      items: [
        {
          id: String(id),
          title: `Seña Rentify · ${description}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: Number(amount),
        },
      ],
      external_reference: String(id),
      back_urls: {
        success: `${front}/mis-reservas/${id}?pago=success`,
        pending: `${front}/mis-reservas/${id}?pago=pending`,
        failure: `${front}/mis-reservas/${id}?pago=failure`,
      },
      notification_url: `${required('BACKEND_URL')}/payments/mercadopago/webhook`,
    });
    if (!data.sandbox_init_point)
      throw new ServiceUnavailableException('No se recibió un checkout de prueba.');
    return data.sandbox_init_point as string;
  }
  async payment(id: string): Promise<ExternalPayment> {
    if (!/^\d+$/.test(id)) throw new BadRequestException('ID de pago inválido.');
    return this.request(`/v1/payments/${id}`);
  }
  verifySignature(id: string, signature: string, requestId: string) {
    if (!env('MERCADOPAGO_WEBHOOK_SECRET'))
      throw new ServiceUnavailableException(
        'Falta configurar la firma del webhook de Mercado Pago.',
      );
    const fields = Object.fromEntries(signature.split(',').map((s) => s.trim().split('=')));
    const ts = fields.ts,
      v1 = fields.v1;
    if (!ts || !/^\d+$/.test(ts) || !v1 || !/^[a-f0-9]{64}$/i.test(v1) || !requestId || !id)
      throw new UnauthorizedException('Firma de webhook inválida.');
    const expected = createHmac('sha256', required('MERCADOPAGO_WEBHOOK_SECRET'))
      .update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`)
      .digest();
    if (!timingSafeEqual(expected, Buffer.from(v1, 'hex')))
      throw new UnauthorizedException('Firma de webhook inválida.');
    const timestamp = Number(ts) * (ts.length <= 10 ? 1000 : 1);
    if (Math.abs(Date.now() - timestamp) > 10 * 60000)
      throw new UnauthorizedException('Notificación expirada.');
  }
}
