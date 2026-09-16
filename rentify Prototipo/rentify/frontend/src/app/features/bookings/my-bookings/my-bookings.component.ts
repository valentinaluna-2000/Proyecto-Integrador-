import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReservationsService } from '../../../core/services/reservations.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Reservation } from '../../../core/models/reservation.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LoadingComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="container section">
      <h1>Mis reservas</h1>

      @if (loading()) {
        <app-loading label="Cargando tus reservas..." />
      } @else if (reservations().length === 0) {
        <div class="empty-state">
          Todavia no tenes reservas. <a routerLink="/propiedades">Explora propiedades</a>.
        </div>
      } @else {
        <div class="bookings-list">
          @for (r of reservations(); track r.id) {
            <div class="card booking-item" [class.highlight]="r.id === highlightId()">
              <div class="booking-main">
                <h4>{{ r.property?.nombre }}</h4>
                <p class="text-muted">{{ r.fechaDesde }} → {{ r.fechaHasta }} · {{ r.noches }} noches</p>
                <app-status-badge [status]="r.estado" />
              </div>
              <div class="booking-amounts">
                <span>Total: $ {{ r.importeTotal | number }}</span>
                <span>Sena: $ {{ r.importeSena | number }}</span>
                @if (r.estado === 'PENDING_PAYMENT') {
                  <span class="text-muted">Vence: {{ r.fechaVencimientoTemporal | date:'short' }}</span>
                }
              </div>
              <div class="booking-actions">
                @if (r.estado === 'PENDING_PAYMENT') {
                  <button class="btn btn-secondary btn-sm" [disabled]="payingId() === r.id" (click)="pagar(r)">
                    {{ payingId() === r.id ? 'Redirigiendo...' : 'Pagar sena' }}
                  </button>
                }
                @if (r.estado === 'PENDING_PAYMENT' || r.estado === 'CONFIRMED') {
                  <button class="btn btn-outline btn-sm" (click)="abrirCancelacion(r)">Cancelar</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (cancelTarget()) {
      <div class="motivo-overlay">
        <div class="card motivo-box">
          <label class="form-label">Motivo de la cancelacion</label>
          <textarea class="form-control" [(ngModel)]="motivoCancelacion" rows="3"></textarea>
          <label class="checkbox-line">
            <input type="checkbox" [(ngModel)]="causaExcepcional" />
            Es una causa excepcional (permite cancelar dentro de las 72hs)
          </label>
          <div class="motivo-actions">
            <button class="btn btn-outline" (click)="cancelTarget.set(null)">Volver</button>
            <button class="btn btn-danger" [disabled]="!motivoCancelacion.trim()" (click)="confirmarCancelacion()">
              Confirmar cancelacion
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .bookings-list { display: flex; flex-direction: column; gap: 14px; }
    .booking-item {
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 16px;
      align-items: center;
    }
    .booking-item.highlight { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(47,111,237,0.25); }
    .booking-main h4 { margin-bottom: 4px; }
    .booking-amounts { display: flex; flex-direction: column; gap: 4px; font-size: 0.88rem; }
    .booking-actions { display: flex; gap: 8px; }
    .motivo-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1600; padding: 20px;
    }
    .motivo-box { padding: 24px; max-width: 420px; width: 100%; display: flex; flex-direction: column; gap: 10px; }
    .checkbox-line { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--color-text-muted); }
    .motivo-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
    @media (max-width: 720px) {
      .booking-item { grid-template-columns: 1fr; }
    }
  `],
})
export class MyBookingsComponent implements OnInit {
  private reservationsService = inject(ReservationsService);
  private paymentsService = inject(PaymentsService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);

  reservations = signal<Reservation[]>([]);
  loading = signal(true);
  payingId = signal<number | null>(null);
  highlightId = signal<number | null>(null);

  cancelTarget = signal<Reservation | null>(null);
  motivoCancelacion = '';
  causaExcepcional = false;

  ngOnInit(): void {
    const highlight = this.route.snapshot.queryParamMap.get('highlight');
    if (highlight) this.highlightId.set(Number(highlight));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.reservationsService.findMine(undefined, 1, 50).subscribe({
      next: (res) => {
        this.reservations.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pagar(r: Reservation) {
    this.payingId.set(r.id);
    this.paymentsService.createPreference(r.id).subscribe({
      next: (res) => {
        window.location.href = res.initPoint;
      },
      error: (err) => {
        this.payingId.set(null);
        this.notify.error(err?.error?.message || 'No se pudo iniciar el pago.');
      },
    });
  }

  abrirCancelacion(r: Reservation) {
    this.motivoCancelacion = '';
    this.causaExcepcional = false;
    this.cancelTarget.set(r);
  }

  confirmarCancelacion() {
    const r = this.cancelTarget();
    if (!r || !this.motivoCancelacion.trim()) return;
    this.reservationsService.cancel(r.id, this.motivoCancelacion, this.causaExcepcional).subscribe({
      next: () => {
        this.notify.success('Reserva cancelada correctamente.');
        this.cancelTarget.set(null);
        this.load();
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'No se pudo cancelar la reserva.');
      },
    });
  }
}
