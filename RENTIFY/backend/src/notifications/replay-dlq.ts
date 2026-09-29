import { Kafka } from 'kafkajs';
import { randomUUID } from 'crypto';
import { env } from '../common/config';
import { VERIFICATION, RECOVERY } from '../auth/auth.service';
// Explicit operator command. A fresh group reads retained DLQ events; original eventIds
// preserve consumer idempotency. Stop with Ctrl+C after caught up.
async function run() {
  const kafka = new Kafka({
    clientId: 'rentify-dlq-replay',
    brokers: env('KAFKA_BROKERS', 'localhost:9092').split(','),
    logLevel: 0,
  });
  const consumer = kafka.consumer({ groupId: `rentify-dlq-replay-${randomUUID()}` }),
    producer = kafka.producer();
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'rentify.notifications.dlq', fromBeginning: true });
  const stop = async () => {
    await consumer.disconnect();
    await producer.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value?.toString() || '{}');
      if (
        event.version !== 1 ||
        !event.eventId ||
        !['EMAIL_VERIFICATION', 'PASSWORD_RECOVERY'].includes(event.type)
      )
        throw new Error('Evento inválido en DLQ.');
      await producer.send({
        topic: event.type === 'EMAIL_VERIFICATION' ? VERIFICATION : RECOVERY,
        messages: [{ key: event.eventId, value: JSON.stringify(event) }],
      });
      console.log(`Republicado: ${event.eventId}`);
    },
  });
}
run().catch(() => {
  console.error('No se pudo reprocesar DLQ. Revisá Kafka.');
  process.exitCode = 1;
});
