import { Module } from '@nestjs/common';
import { MercadoPagoAdapter } from './mercado-pago.adapter';
import { OpenMeteoAdapter } from './open-meteo.adapter';
import { GoogleMapsAdapter } from './google-maps.adapter';
import { ResendAdapter } from './resend.adapter';

@Module({ providers: [MercadoPagoAdapter, OpenMeteoAdapter, GoogleMapsAdapter, ResendAdapter], exports: [MercadoPagoAdapter, OpenMeteoAdapter, GoogleMapsAdapter, ResendAdapter] })
export class IntegrationsModule {}
