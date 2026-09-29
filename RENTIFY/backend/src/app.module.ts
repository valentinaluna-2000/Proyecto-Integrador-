import { Module, Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PersistenciaModule } from './persistence/persistence.module';
import { IntegracionServiciosExternosModule } from './integrations/integrations.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthGuard, RolesGuard } from './auth/security';
import { UsersService } from './users/users.service';
import { PropertiesService } from './properties/properties.service';
import {
  PropertiesController,
  AdminPropertiesController,
} from './properties/properties.controller';
import { AvailabilityService } from './availability/availability.service';
import { ExternalService } from './integrations/external.service';
import { ReservationsService } from './reservations/reservations.service';
import { ReservationsController } from './reservations/reservations.controller';
import { CancellationsService } from './cancellations/cancellations.service';
import { PaymentsService } from './payments/payments.service';
import { WebhookController } from './payments/webhook.controller';
import { ReportsService } from './reports/reports.service';
import { AdminController } from './reports/admin.controller';
import { JobVencimientoReservas } from './jobs/expiration.job';
import { OutboxJob } from './jobs/outbox.job';
import { env } from './common/config';
@Module({
  providers: [AuthService, UsersService, AuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthGuard, RolesGuard],
})
export class GestionUsuariosModule {}
@Module({ providers: [AvailabilityService], exports: [AvailabilityService] })
export class GestionDisponibilidadModule {}
@Module({
  imports: [GestionUsuariosModule, GestionDisponibilidadModule],
  providers: [PropertiesService, ExternalService],
  controllers: [PropertiesController, AdminPropertiesController],
  exports: [PropertiesService],
})
export class GestionPropiedadesModule {}
@Module({ providers: [CancellationsService], exports: [CancellationsService] })
export class GestionCancelacionesModule {}
@Module({
  providers: [PaymentsService],
  controllers: [WebhookController],
  exports: [PaymentsService],
})
export class GestionPagosModule {}
@Module({
  imports: [GestionUsuariosModule, GestionPagosModule, GestionCancelacionesModule],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class GestionReservasModule {}
@Module({
  imports: [
    GestionUsuariosModule,
    GestionReservasModule,
    GestionPagosModule,
    GestionCancelacionesModule,
  ],
  providers: [ReportsService],
  controllers: [AdminController],
})
export class GestionReportesModule {}
@Module({ imports: [GestionDisponibilidadModule], providers: [JobVencimientoReservas, OutboxJob] })
export class ProcesosImportadoresYNotificadoresModule {}
@Controller()
class SystemController {
  @Get('health') health() {
    return { status: 'ok', service: 'Rentify' };
  }
  @Get('config') config() {
    return {
      supabaseUrl: env('SUPABASE_URL'),
      supabaseAnonKey: env('SUPABASE_ANON_KEY'),
      googleMapsKey: env('GOOGLE_MAPS_EMBED_API_KEY'),
    };
  }
}
@Module({
  imports: [
    PersistenciaModule,
    IntegracionServiciosExternosModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    GestionUsuariosModule,
    GestionDisponibilidadModule,
    GestionPropiedadesModule,
    GestionReservasModule,
    GestionReportesModule,
    ProcesosImportadoresYNotificadoresModule,
  ],
  controllers: [SystemController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
