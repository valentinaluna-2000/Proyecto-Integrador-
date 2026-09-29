import { Controller, Logger, UseFilters } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { IEmailProvider, EventPublisher, EmailEvent } from '../common/ports';
import { EmailReceipt } from '../persistence/entities';
import { VERIFICATION, RECOVERY } from '../auth/auth.service';
import { NotificationErrorFilter } from './rpc-error.filter';
@UseFilters(new NotificationErrorFilter())
@Controller()
export class NotificadorEmail {
  private logger = new Logger(NotificadorEmail.name);
  constructor(
    private db: DataSource,
    private email: IEmailProvider,
    private publisher: EventPublisher,
  ) {}
  @EventPattern(VERIFICATION) verification(@Payload() data: EmailEvent) {
    return this.process(data, false);
  }
  @EventPattern(RECOVERY) recovery(@Payload() data: EmailEvent) {
    return this.process(data, true);
  }
  async process(event: EmailEvent, recovery: boolean) {
    if (
      event?.version !== 1 ||
      !event.eventId ||
      !event.actionUrl ||
      event.type !== (recovery ? 'PASSWORD_RECOVERY' : 'EMAIL_VERIFICATION')
    )
      throw new Error('Evento de email inválido.');
    await this.db.transaction(async (tx) => {
      await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [event.eventId]);
      if (await tx.getRepository(EmailReceipt).existsBy({ event_id: event.eventId })) return;
      let sent = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (recovery) await this.email.sendPasswordRecoveryEmail(event);
          else await this.email.sendVerificationEmail(event);
          sent = true;
          break;
        } catch {
          this.logger.warn(`Falló SMTP, intento ${attempt + 1}, evento ${event.eventId}`);
          if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        }
      }
      if (sent) {
        await tx.save(EmailReceipt, { event_id: event.eventId, sent_at: new Date() });
        this.logger.log(`Email aceptado por SMTP: ${event.eventId}`);
        return;
      }
      await this.publisher.publish('rentify.notifications.dlq', event);
      this.logger.error(`Evento enviado a DLQ: ${event.eventId}`);
    });
  }
}
