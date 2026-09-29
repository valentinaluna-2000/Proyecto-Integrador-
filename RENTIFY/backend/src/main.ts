import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { validationPipe } from './common/validation';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env, required } from './common/config';
import { ErrorFilter } from './common/error.filter';
async function bootstrap() {
  if (env('NODE_ENV') === 'production') required('MERCADOPAGO_WEBHOOK_SECRET');
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: env('FRONTEND_URL', 'http://localhost:4200'),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(validationPipe());
  app.useGlobalFilters(new ErrorFilter());
  app.enableShutdownHooks();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Rentify API')
        .setDescription('Alquileres temporarios · Mercado Pago TEST · Todos los importes en ARS')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    ),
  );
  await app.listen(Number(env('PORT', '3000')));
  Logger.log('Rentify API lista. Swagger: /docs');
}
bootstrap().catch(() => {
  console.error(
    'No se pudo iniciar Rentify. Revisá la configuración y conectividad de PostgreSQL/Supabase.',
  );
  process.exit(1);
});
