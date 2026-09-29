import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EventPublisher, EmailEvent } from '../../common/ports';
import { env } from '../../common/config';
@Injectable()
export class KafkaPublisher extends EventPublisher implements OnModuleDestroy {
  private client = new ClientKafka({
    client: {
      clientId: env('KAFKA_CLIENT_ID', 'rentify'),
      brokers: env('KAFKA_BROKERS', 'localhost:9092').split(','),
      retry: { retries: 3 },
      logLevel: 0,
    },
    producerOnlyMode: true,
  });
  async publish(topic: string, event: EmailEvent) {
    await firstValueFrom(this.client.emit(topic, { key: event.eventId, value: event }));
  }
  async onModuleDestroy() {
    await this.client.close();
  }
}
