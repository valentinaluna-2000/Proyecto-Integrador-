import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { EventPublisher, EmailEvent } from '../common/ports';
@Injectable()
export class OutboxJob {
  private running = false;
  private logger = new Logger(OutboxJob.name);
  constructor(
    private db: DataSource,
    private publisher: EventPublisher,
  ) {}
  @Interval(5000)
  async flush() {
    if (this.running) return;
    this.running = true;
    try {
      await this.db.transaction(async (tx) => {
        const rows = await tx.query(
          'SELECT * FROM email_outbox WHERE published_at IS NULL ORDER BY id LIMIT 20 FOR UPDATE SKIP LOCKED',
        );
        for (const row of rows) {
          await this.publisher.publish(row.topic, row.payload as EmailEvent);
          await tx.query('UPDATE email_outbox SET published_at=now(), payload=$2 WHERE id=$1', [
            row.id,
            JSON.stringify({ eventId: row.event_id, published: true }),
          ]);
          this.logger.log(`Evento publicado: ${row.event_id}`);
        }
      });
    } catch {
      this.logger.warn('Kafka no disponible; los eventos permanecen pendientes para reintento.');
    } finally {
      this.running = false;
    }
  }
}
