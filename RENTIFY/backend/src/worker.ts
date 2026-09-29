import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { PersistenciaModule } from './persistence/persistence.module';
import { IEmailProvider, EventPublisher } from './common/ports';
import { GmailSmtpEmailProvider } from './integrations/email/gmail.provider';
import { KafkaPublisher } from './integrations/kafka/kafka.publisher';
import { NotificadorEmail } from './notifications/notifier';
import { env } from './common/config';
@Module({
  imports: [PersistenciaModule],
  controllers: [NotificadorEmail],
  providers: [
    { provide: IEmailProvider, useClass: GmailSmtpEmailProvider },
    { provide: EventPublisher, useClass: KafkaPublisher },
  ],
})
class WorkerModule {}
async function run() {
  const app = await NestFactory.createMicroservice(WorkerModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: `${env('KAFKA_CLIENT_ID', 'rentify')}-worker`,
        brokers: env('KAFKA_BROKERS', 'localhost:9092').split(','),
        logLevel: 0,
      },
      consumer: {
        groupId: env('KAFKA_GROUP_ID', 'rentify-email-v1'),
        sessionTimeout: 90000,
        heartbeatInterval: 3000,
      },
      subscribe: { fromBeginning: true },
    },
  });
  app.enableShutdownHooks();
  await app.listen();
  console.log('Notificador listo: consumidor conectado a Kafka.');
}
run().catch(() => {
  console.error('No se pudo iniciar el notificador. Revisá Kafka, PostgreSQL y SMTP.');
  process.exit(1);
});
