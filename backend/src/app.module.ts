import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministradorLogicModule } from './business-persistent/administrador/administrador-logic.module';
import { CancelacionLogicModule } from './business-persistent/cancelacion/cancelacion-logic.module';
import { ClienteLogicModule } from './business-persistent/cliente/cliente-logic.module';
import { ImagenPropiedadLogicModule } from './business-persistent/imagen-propiedad/imagen-propiedad-logic.module';
import { PagoLogicModule } from './business-persistent/pago/pago-logic.module';
import { PeriodoBloqueadoLogicModule } from './business-persistent/periodo-bloqueado/periodo-bloqueado-logic.module';
import { PropiedadLogicModule } from './business-persistent/propiedad/propiedad-logic.module';
import { PropietarioLogicModule } from './business-persistent/propietario/propietario-logic.module';
import { ReservaLogicModule } from './business-persistent/reserva/reserva-logic.module';
import { AuthModule } from './presentation-web/auth/auth.module';
import { AdministradorModule } from './presentation-web/administrador/administrador.module';
import { CancelacionModule } from './presentation-web/cancelacion/cancelacion.module';
import { ClienteModule } from './presentation-web/cliente/cliente.module';
import { ImagenPropiedadModule } from './presentation-web/imagen-propiedad/imagen-propiedad.module';
import { IntegrationsModule } from './business-non-persistent/integrations/integrations.module';
import { PagoModule } from './presentation-web/pago/pago.module';
import { PeriodoBloqueadoModule } from './presentation-web/periodo-bloqueado/periodo-bloqueado.module';
import { PropiedadModule } from './presentation-web/propiedad/propiedad.module';
import { PropietarioModule } from './presentation-web/propietario/propietario.module';
import { ReservaModule } from './presentation-web/reserva/reserva.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get<string>('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    // Capa lógica persistente (servicios y repositorios TypeORM).
    PropietarioLogicModule, AdministradorLogicModule, ClienteLogicModule, PropiedadLogicModule,
    ImagenPropiedadLogicModule, ReservaLogicModule, PeriodoBloqueadoLogicModule, PagoLogicModule,
    CancelacionLogicModule,
    // Capa de presentación y adaptadores de servicios externos.
    AuthModule, PropietarioModule, AdministradorModule, ClienteModule, PropiedadModule,
    ImagenPropiedadModule, ReservaModule, PeriodoBloqueadoModule, PagoModule, CancelacionModule,
    IntegrationsModule,
  ],
})
export class AppModule {}
