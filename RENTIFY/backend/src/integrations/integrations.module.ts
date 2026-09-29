import { Global, Module } from '@nestjs/common';
import { IAutenticacion, ImageStorage, EventPublisher, WeatherProvider } from '../common/ports';
import { SupabaseAuthAdapter, SupabaseImageStorage } from './supabase/supabase.adapter';
import { KafkaPublisher } from './kafka/kafka.publisher';
import { IntegracionPasarelaPagoModule } from './mercadopago/mercadopago.module';
import { OpenMeteoWeatherProvider } from './weather/open-meteo.provider';
@Global()
@Module({
  imports: [IntegracionPasarelaPagoModule],
  providers: [
    SupabaseAuthAdapter,
    { provide: IAutenticacion, useExisting: SupabaseAuthAdapter },
    { provide: ImageStorage, useClass: SupabaseImageStorage },
    { provide: EventPublisher, useClass: KafkaPublisher },
    { provide: WeatherProvider, useClass: OpenMeteoWeatherProvider },
  ],
  exports: [
    IAutenticacion,
    ImageStorage,
    EventPublisher,
    IntegracionPasarelaPagoModule,
    WeatherProvider,
  ],
})
export class IntegracionServiciosExternosModule {}
