import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service';

@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name);

  constructor(private reservationsService: ReservationsService) {}

  /**
   * Corre cada minuto: libera las fechas de las reservas PENDING_PAYMENT
   * cuyo plazo de pago de la sena (90 minutos por defecto) ya expiro.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    const affected = await this.reservationsService.expireOverdueReservations();
    if (affected > 0) {
      this.logger.log(`Se vencieron ${affected} reserva(s) temporal(es) sin pago.`);
    }
  }

  /**
   * Corre una vez por hora: marca como COMPLETED las reservas confirmadas
   * cuya estadia ya finalizo, para que los reportes distingan historial de
   * reservas vigentes.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCompletedStays() {
    const affected = await this.reservationsService.completeFinishedStays();
    if (affected > 0) {
      this.logger.log(`Se marcaron ${affected} reserva(s) como completadas.`);
    }
  }
}
