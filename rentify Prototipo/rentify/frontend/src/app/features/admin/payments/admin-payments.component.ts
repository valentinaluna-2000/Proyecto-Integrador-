import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsService } from '../../../core/services/payments.service';
import { Payment, Reservation } from '../../../core/models/reservation.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface PaymentRow extends Payment {
  reservation?: Reservation;
}

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, LoadingComponent, StatusBadgeComponent],
  template: `
    <h2>Pagos</h2>

    @if (loading()) {
      <app-loading />
    } @else if (payments().length === 0) {
      <div class="empty-state">Todavia no se registraron pagos.</div>
    } @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Propiedad</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>ID externo (MP)</th>
              <th>Fecha de pago</th>
            </tr>
          </thead>
          <tbody>
            @for (p of payments(); track p.id) {
              <tr>
                <td>#{{ p.reservation?.id }}</td>
                <td>{{ p.reservation?.property?.nombre }}</td>
                <td>{{ p.reservation?.cliente?.nombre }} {{ p.reservation?.cliente?.apellido }}</td>
                <td>$ {{ p.monto | number }}</td>
                <td><app-status-badge [status]="p.estado" /></td>
                <td class="text-muted">{{ p.externalPaymentId || '—' }}</td>
                <td>{{ p.paidAt ? (p.paidAt | date:'short') : '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--color-border); font-size: 0.9rem; }
    th { color: var(--color-text-muted); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
  `],
})
export class AdminPaymentsComponent implements OnInit {
  private paymentsService = inject(PaymentsService);

  payments = signal<PaymentRow[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.paymentsService.findAllAdmin().subscribe({
      next: (data) => {
        this.payments.set(data as PaymentRow[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
