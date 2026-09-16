import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertiesService } from '../../../../core/services/properties.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Property } from '../../../../core/models/property.model';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-property-list-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, StatusBadgeComponent],
  template: `
    <div class="header-row">
      <h2>Mis propiedades</h2>
      <a routerLink="/admin/propiedades/nueva" class="btn btn-primary">+ Nueva propiedad</a>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (properties().length === 0) {
      <div class="empty-state">Todavia no registraste propiedades.</div>
    } @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Precio/noche</th>
              <th>Sena</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of properties(); track p.id) {
              <tr>
                <td>{{ p.nombre }}</td>
                <td>{{ p.ciudad }}</td>
                <td>$ {{ p.precioNoche | number }}</td>
                <td>{{ p.porcentajeSena }}%</td>
                <td><app-status-badge [status]="p.estado" /></td>
                <td class="actions">
                  <a [routerLink]="['/admin/propiedades', p.id]" class="btn btn-outline btn-sm">Editar</a>
                  @if (p.estado === 'activa') {
                    <button class="btn btn-danger btn-sm" (click)="toggle(p, false)">Desactivar</button>
                  } @else {
                    <button class="btn btn-secondary btn-sm" (click)="toggle(p, true)">Activar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--color-border); font-size: 0.92rem; }
    th { color: var(--color-text-muted); font-weight: 600; font-size: 0.82rem; text-transform: uppercase; }
    .actions { display: flex; gap: 8px; }
  `],
})
export class PropertyListAdminComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private notify = inject(NotificationService);

  properties = signal<Property[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.propertiesService.findAllForAdmin().subscribe({
      next: (data) => {
        this.properties.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(p: Property, activate: boolean) {
    const action = activate ? this.propertiesService.activate(p.id) : this.propertiesService.deactivate(p.id);
    action.subscribe({
      next: () => {
        this.notify.success(activate ? 'Propiedad activada.' : 'Propiedad desactivada.');
        this.load();
      },
      error: (err) => this.notify.error(err?.error?.message || 'No se pudo actualizar la propiedad.'),
    });
  }
}
