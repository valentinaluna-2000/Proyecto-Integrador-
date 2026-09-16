import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropietariosModule } from './propietarios/propietarios.module';
import { PropertiesModule } from './properties/properties.module';
import { PropertyImagesModule } from './property-images/property-images.module';
import { BlockedPeriodsModule } from './blocked-periods/blocked-periods.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    ScheduleModule.forRoot(),
    MailModule,
    AuthModule,
    UsersModule,
    PropietariosModule,
    PropertiesModule,
    PropertyImagesModule,
    BlockedPeriodsModule,
    ReservationsModule,
    PaymentsModule,
    ReportsModule,
    IntegrationsModule,
  ],
})
export class AppModule {}
