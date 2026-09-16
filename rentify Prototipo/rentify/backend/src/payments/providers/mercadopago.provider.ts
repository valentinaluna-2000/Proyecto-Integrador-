import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import {
  CreatePreferenceInput,
  CreatePreferenceOutput,
  ExternalPaymentInfo,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private client: MercadoPagoConfig | null = null;
  private readonly accessToken: string | undefined;

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (this.accessToken) {
      this.client = new MercadoPagoConfig({ accessToken: this.accessToken });
    } else {
      this.logger.warn(
        'MERCADOPAGO_ACCESS_TOKEN no configurado. El modulo de pagos funcionara ' +
          'en modo de desarrollo (sin credenciales reales): las preferencias no ' +
          'podran crearse contra Mercado Pago hasta que se configure la variable.',
      );
    }
  }

  private ensureClient(): MercadoPagoConfig {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'La integracion con Mercado Pago no esta configurada (falta MERCADOPAGO_ACCESS_TOKEN). ' +
          'Configura la variable de entorno para habilitar el pago de la sena.',
      );
    }
    return this.client;
  }

  async createPreference(
    input: CreatePreferenceInput,
  ): Promise<CreatePreferenceOutput> {
    const client = this.ensureClient();
    const preference = new Preference(client);

    const timeoutMs = 8000;
    const result = await this.withTimeout(
      preference.create({
        body: {
          items: [
            {
              id: `reserva-${input.reservationId}`,
              title: input.title,
              quantity: 1,
              unit_price: input.amount,
              currency_id: 'ARS',
            },
          ],
          payer: { email: input.payerEmail },
          external_reference: String(input.reservationId),
          back_urls: {
            success: input.successUrl,
            failure: input.failureUrl,
            pending: input.pendingUrl,
          },
          auto_return: 'approved',
          notification_url: input.notificationUrl,
        },
      }),
      timeoutMs,
    );

    return {
      preferenceId: result.id as string,
      initPoint: (result.init_point || result.sandbox_init_point) as string,
    };
  }

  async getPaymentInfo(externalPaymentId: string): Promise<ExternalPaymentInfo> {
    const client = this.ensureClient();
    const paymentClient = new MPPayment(client);
    const result = await this.withTimeout(paymentClient.get({ id: externalPaymentId }), 8000);

    return {
      id: String(result.id),
      status: result.status || 'unknown',
      statusDetail: result.status_detail || '',
      amount: result.transaction_amount || 0,
      externalReference: result.external_reference || null,
      raw: result as any,
    };
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new ServiceUnavailableException('Tiempo de espera agotado al contactar Mercado Pago.')),
        ms,
      );
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
