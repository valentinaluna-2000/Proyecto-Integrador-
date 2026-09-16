import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const uploadDir = process.env.UPLOAD_DIR || './uploads/properties';
  fs.mkdirSync(uploadDir, { recursive: true });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.use(helmet());

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  app.enableCors({
    origin: frontendUrl.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Rentify API')
    .setDescription(
      'API REST para la gestion de alquileres temporarios de propiedades. ' +
        'Incluye autenticacion, propiedades, disponibilidad, reservas, pagos (Mercado Pago), ' +
        'integraciones externas (clima y mapas) y reportes.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Rentify backend escuchando en el puerto ${port}`);
  console.log(`Swagger disponible en /api/docs`);
}
bootstrap();
