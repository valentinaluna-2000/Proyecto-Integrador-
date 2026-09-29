import { Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { KafkaRetriableException } from '@nestjs/microservices';
import { throwError } from 'rxjs';
@Catch()
export class NotificationErrorFilter implements ExceptionFilter {
  private logger = new Logger('NotificadorEmail');
  catch() {
    this.logger.error(
      'Procesamiento interrumpido. El evento se conserva para reintento; no se registran sus datos.',
    );
    return throwError(() => new KafkaRetriableException('No se pudo completar la notificación.'));
  }
}
