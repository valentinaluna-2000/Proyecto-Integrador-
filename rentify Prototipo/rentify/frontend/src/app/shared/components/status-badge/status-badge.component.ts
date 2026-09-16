import { Component, Input } from '@angular/core';

const LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  CONFIRMED: 'Confirmada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  activa: 'Activa',
  inactiva: 'Inactiva',
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  in_process: 'En proceso',
};

const CLASSES: Record<string, string> = {
  PENDING_PAYMENT: 'badge-warning',
  CONFIRMED: 'badge-success',
  EXPIRED: 'badge-neutral',
  CANCELLED: 'badge-danger',
  COMPLETED: 'badge-info',
  activa: 'badge-success',
  inactiva: 'badge-neutral',
  approved: 'badge-success',
  pending: 'badge-warning',
  rejected: 'badge-danger',
  cancelled: 'badge-danger',
  in_process: 'badge-info',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="cssClass">{{ label }}</span>`,
})
export class StatusBadgeComponent {
  @Input() status = '';

  get label(): string {
    return LABELS[this.status] || this.status;
  }
  get cssClass(): string {
    return CLASSES[this.status] || 'badge-neutral';
  }
}
