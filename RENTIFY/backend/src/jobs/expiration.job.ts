import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { AvailabilityService } from '../availability/availability.service';
@Injectable()
export class JobVencimientoReservas {
  private running = false;
  private logger = new Logger(JobVencimientoReservas.name);
  constructor(private availability: AvailabilityService) {}
  @Interval(30000) async run() {
    if (this.running) return;
    this.running = true;
    try {
      await this.availability.expire();
    } catch {
      this.logger.error('No se pudo ejecutar el vencimiento de reservas.');
    } finally {
      this.running = false;
    }
  }
}
