import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsService } from '../../../core/services/reservations.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Reservation, ReservationStatus } from '../../../core/models/reservation.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, StatusBadgeComponent, PaginationComponent],
  template: `
    <h2>Reservas</h2>

    <div class="filters card">
      <select class="form-control" [(ngModel)]="estadoFiltro" (change)="load(1)">
        <option value="">Todos los estados</option>
        <option value="PENDING_PAYMENT">Pendiente de pago</option>
        <option value="CONFIRMED">Confirmada</option>
        <option value="EXPIRED">Vencida</option>
        <option value="CANCELLED">Cancelada</option>
        <option value="COMPLETED">Completada</option>
      </select>
      <input class="form-control" type="date" [(ngModel)]="desdeFiltro" (change)="load(1)" placeholder="Desde" />
      <input class="form-control" type="date" [(ngModel)]="hastaFiltro" (change)="load(1)" placeholder="Hasta" />
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (reservations().length === 0) {
      <div class="empty-state">No se encontraron reservas con esos filtros.</div>
    } @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Cliente</th>
              <th>Fechas</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of reservations(); track r.id) {
              <tr>
                <td>{{ r.property?.nombre }}</td>
                <td>{{ r.cliente?.nombre }} {{ r.cliente?.apellido }}</td>
                <td>{{ r.fechaDesde }} → {{ r.fechaHasta }}</td>
                <td>$ {{ r.importeTotal | number }}</td>
                <td><app-status-badge [status]="r.estado" /></td>
                <td>
                  @if (r.estado === 'PENDING_PAYMENT' || r.estado === 'CONFIRMED') {
                    <button class="btn btn-outline btn-sm" (click)="abrirCancelacion(r)">Cancelar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="load($event)" />
    }

    @if (cancelTarget()) {
      <div class="motivo-overlay">
        <div class="card motivo-box">
          <h3>Cancelar reserva #{{ cancelTarget()!.id }}</h3>
          <label class="form-label">Motivo</label>
          <textarea class="form-control" [(ngModel)]="motivo" rows="3"></textarea>
          <label class="checkbox-line">
            <input type="checkbox" [(ngModel)]="causaExcepcional" /> Causa excepcional
          </label>
          <p class="text-muted" style="font-size:0.82rem">
            Si la reserva ya tiene un pago aprobado, se registrara reintegro total automaticamente.
          </p>
          <div class="motivo-actions">
            <button class="btn btn-outline" (click)="cancelTarget.set(null)">Volver</button>
            <button class="btn btn-danger" [disabled]="!motivo.trim()" (click)="confirmarCancelacion()">
              Confirmar cancelacion
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .filters { display: flex; gap: 12px; padding: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .filters select, .filters input { max-width: 220px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--color-border); font-size: 0.9rem; }
    th { color: var(--color-text-muted); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
    .motivo-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1600; padding: 20px;
    }
    .motivo-box { padding: 24px; max-width: 440px; width: 100%; display: flex; flex-direction: column; gap: 10px; }
    .checkbox-line { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
    .motivo-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class AdminReservationsComponent implements OnInit {
  private reservationsService = inject(ReservationsService);
  private notify = inject(NotificationService);

  reservations = signal<Reservation[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);

  estadoFiltro = '';
  desdeFiltro = '';
  hastaFiltro = '';

  cancelTarget = signal<Reservation | null>(null);
  motivo = '';
  causaExcepcional = false;

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number) {
    this.loading.set(true);
    this.reservationsService
      .findAllAdmin({
        estado: (this.estadoFiltro as ReservationStatus) || undefined,
        desde: this.desdeFiltro || undefined,
        hasta: this.hastaFiltro || undefined,
        page,
        limit: 10,
      })
      .subscribe({
        next: (res) => {
          this.reservations.set(res.data);
          this.page.set(res.meta.page);
          this.totalPages.set(res.meta.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  abrirCancelacion(r: Reservation) {
    this.motivo = '';
    this.causaExcepcional = false;
    this.cancelTarget.set(r);
  }

  confirmarCancelacion() {
    const r = this.cancelTarget();
    if (!r || !this.motivo.trim()) return;
    this.reservationsService.cancel(r.id, this.motivo, this.causaExcepcional).subscribe({
      next: () => {
        this.notify.success('Reserva cancelada correctamente.');
        this.cancelTarget.set(null);
        this.load(this.page());
      },
      error: (err) => this.notify.error(err?.error?.message || 'No se pudo cancelar la reserva.'),
    });
  }
}
