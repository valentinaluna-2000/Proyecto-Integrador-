import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertiesService } from '../../../core/services/properties.service';
import { Property, PropertyQuery } from '../../../core/models/property.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent, PaginationComponent],
  template: `
    <div class="container section">
      <h1>Propiedades disponibles</h1>

      <form [formGroup]="filters" (ngSubmit)="search(1)" class="filters card">
        <div class="filters-grid">
          <div class="form-group">
            <label class="form-label">Ciudad</label>
            <input class="form-control" formControlName="ciudad" placeholder="Ej: Cordoba" />
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-control" formControlName="tipo">
              <option value="">Todos</option>
              <option value="casa">Casa</option>
              <option value="cabana">Cabana</option>
              <option value="departamento">Departamento</option>
              <option value="quinta">Quinta</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Precio min.</label>
            <input class="form-control" type="number" formControlName="precioMin" />
          </div>
          <div class="form-group">
            <label class="form-label">Precio max.</label>
            <input class="form-control" type="number" formControlName="precioMax" />
          </div>
          <div class="form-group">
            <label class="form-label">Huespedes</label>
            <input class="form-control" type="number" formControlName="capacidadMinima" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Entrada</label>
            <input class="form-control" type="date" formControlName="fechaDesde" />
          </div>
          <div class="form-group">
            <label class="form-label">Salida</label>
            <input class="form-control" type="date" formControlName="fechaHasta" />
          </div>
          <div class="form-group filter-checkbox">
            <label class="form-label">
              <input type="checkbox" formControlName="aceptaMascotas" /> Acepta mascotas
            </label>
          </div>
        </div>
        <button class="btn btn-primary" type="submit">Buscar</button>
      </form>

      @if (loading()) {
        <app-loading label="Buscando propiedades..." />
      } @else if (properties().length === 0) {
        <div class="empty-state">No se encontraron propiedades con esos filtros.</div>
      } @else {
        <div class="grid grid-3">
          @for (p of properties(); track p.id) {
            <a class="card property-card" [routerLink]="['/propiedades', p.id]">
              <div class="property-image" [style.background-image]="'url(' + (p.imagenes[0]?.url || placeholder) + ')'"></div>
              <div class="property-body">
                <h4>{{ p.nombre }}</h4>
                <p class="text-muted">{{ p.ciudad }} · Hasta {{ p.capacidad }} huespedes</p>
                <p class="price">$ {{ p.precioNoche | number }} / noche</p>
              </div>
            </a>
          }
        </div>
        <app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="search($event)" />
      }
    </div>
  `,
  styles: [`
    .filters { padding: 20px; margin-bottom: 28px; }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 14px;
    }
    .filter-checkbox { justify-content: center; }
    .filter-checkbox label { display: flex; align-items: center; gap: 6px; }
    .property-card { display: block; overflow: hidden; transition: transform 0.15s ease; }
    .property-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .property-image { height: 160px; background-size: cover; background-position: center; background-color: #dfe6f0; }
    .property-body { padding: 14px; }
    .price { font-weight: 700; color: var(--color-primary); margin: 6px 0 0; }
    @media (max-width: 900px) { .filters-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .filters-grid { grid-template-columns: 1fr; } }
  `],
})
export class PropertyListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertiesService = inject(PropertiesService);

  properties = signal<Property[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  placeholder = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600';

  filters = this.fb.group({
    ciudad: [''],
    tipo: [''],
    precioMin: [null as number | null],
    precioMax: [null as number | null],
    capacidadMinima: [null as number | null],
    fechaDesde: [''],
    fechaHasta: [''],
    aceptaMascotas: [false],
  });

  ngOnInit(): void {
    this.search(1);
  }

  search(page: number) {
    this.loading.set(true);
    const raw = this.filters.getRawValue();
    const query: PropertyQuery = {
      ciudad: raw.ciudad || undefined,
      tipo: (raw.tipo as any) || undefined,
      precioMin: raw.precioMin || undefined,
      precioMax: raw.precioMax || undefined,
      capacidadMinima: raw.capacidadMinima || undefined,
      fechaDesde: raw.fechaDesde || undefined,
      fechaHasta: raw.fechaHasta || undefined,
      aceptaMascotas: raw.aceptaMascotas || undefined,
      page,
      limit: 9,
    };
    this.propertiesService.findAll(query).subscribe({
      next: (res) => {
        this.properties.set(res.data);
        this.page.set(res.meta.page);
        this.totalPages.set(res.meta.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
