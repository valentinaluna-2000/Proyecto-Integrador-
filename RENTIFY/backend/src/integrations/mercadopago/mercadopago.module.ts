import { Module } from '@nestjs/common';
import { PaymentGateway } from '../../common/ports';
import { MercadoPagoPaymentGateway } from './mercadopago.gateway';
@Module({
  providers: [{ provide: PaymentGateway, useClass: MercadoPagoPaymentGateway }],
  exports: [PaymentGateway],
})
export class IntegracionPasarelaPagoModule {}
