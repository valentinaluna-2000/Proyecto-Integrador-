import { Controller, Post, Query, Headers, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
@ApiTags('Mercado Pago TEST')
@Controller('payments/mercadopago')
export class WebhookController {
  constructor(private service: PaymentsService) {}
  @Post('webhook') @HttpCode(200) @SkipThrottle() webhook(
    @Query('data.id') id: string,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
  ) {
    if (!id || !signature || !requestId) throw new BadRequestException('Notificación incompleta.');
    return this.service.webhook(id, signature, requestId);
  }
}
