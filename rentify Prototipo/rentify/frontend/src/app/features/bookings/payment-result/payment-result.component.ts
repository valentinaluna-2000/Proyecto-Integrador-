import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { interval, Subscription, take } from 'rxjs';
import { ReservationsService } from '../../../core/services/reservations.service';
import { Reservation } from '../../../core/models/reservation.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [RouterLink, LoadingComponent, StatusBadgeComponent],
  template: `
    <div class="container section result-wrap">
      <div class="card result-card">
        @if (loading()) {
          <app-loading label="Verificando el estado del pago..." />
        } @else if (reservation()) {
          <div class="icon">{{ icon() }}</div>
          <h2>{{ title() }}</h2>
          <p class="text-muted">{{ description() }}</p>
          <app-status-badge [status]="reservation()!.estado" />
          <div class="actions">
            <a routerLink="/mis-reservas" class="btn btn-primary">Ver mis reservas</a>
          </div>
        } @else {
          <p>No pudimos encontrar la reserva.</p>
          <a routerLink="/propiedades" class="btn btn-outline">Volver a propiedades</a>
        }
      </div>
    </div>
  `,
  styles: [`
    .result-wrap { display: flex; justify-content: center; }
    .result-card { padding: 40px; max-width: 460px; text-align: center; }
    .icon { font-size: 3rem; margin-bottom: 10px; }
    .actions { margin-top: 20px; }
  `],
})
export class PaymentResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reservationsService = inject(ReservationsService);

  loading = signal(true);
  reservation = signal<Reservation | null>(null);
  statusParam = '';
  private poll?: Subscription;

  ngOnInit(): void {
    const reservationId = Number(this.route.snapshot.queryParamMap.get('reservationId'));
    this.statusParam = this.route.snapshot.queryParamMap.get('status') || '';

    if (!reservationId) {
      this.loading.set(false);
      return;
    }

    // El webhook de Mercado Pago puede demorar unos segundos en llegar;
    // reintentamos varias veces antes de mostrar el estado final.
    this.poll = interval(2000)
      .pipe(take(8))
      .subscribe(() => this.checkStatus(reservationId));
    this.checkStatus(reservationId);
  }

  private checkStatus(reservationId: number) {
    this.reservationsService.findOne(reservationId).subscribe({
      next: (r) => {
        this.reservation.set(r);
        this.loading.set(false);
        if (r.estado === 'CONFIRMED' || r.estado === 'CANCELLED' || r.estado === 'EXPIRED') {
          this.poll?.unsubscribe();
        }
      },
      error: () => this.loading.set(false),
    });
  }

  icon() {
    const estado = this.reservation()?.estado;
    if (estado === 'CONFIRMED') return '✅';
    if (estado === 'PENDING_PAYMENT') return '⏳';
    return '⚠️';
  }

  title() {
    const estado = this.reservation()?.estado;
    if (estado === 'CONFIRMED') return 'Pago confirmado';
    if (estado === 'PENDING_PAYMENT') return 'Estamos procesando tu pago';
    if (estado === 'EXPIRED') return 'La reserva vencio';
    return 'Reserva actualizada';
  }

  description() {
    const estado = this.reservation()?.estado;
    if (estado === 'CONFIRMED') return 'Tu reserva quedo confirmada. Te enviamos un email con el detalle.';
    if (estado === 'PENDING_PAYMENT')
      return 'Mercado Pago todavia no nos confirmo el resultado del pago. Esta pagina se actualiza automaticamente.';
    if (estado === 'EXPIRED') return 'El plazo para pagar la sena vencio y las fechas quedaron liberadas.';
    return 'Revisa el estado actualizado de tu reserva en Mis reservas.';
  }
}
