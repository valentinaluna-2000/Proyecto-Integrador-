import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertiesService } from '../../../../core/services/properties.service';
import { BlockedPeriodsService } from '../../../../core/services/blocked-periods.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Property, PropertyType } from '../../../../core/models/property.model';
import { BlockedPeriod } from '../../../../core/models/blocked-period.model';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, LoadingComponent],
  template: `
    <div class="header-row">
      <h2>{{ isEdit() ? 'Editar propiedad' : 'Nueva propiedad' }}</h2>
      <a routerLink="/admin/propiedades" class="btn btn-outline">← Volver</a>
    </div>

    @if (loading()) {
      <app-loading />
    } @else {
      <div class="card form-card">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" formControlName="nombre" />
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-control" formControlName="tipo">
                <option value="casa">Casa</option>
                <option value="cabana">Cabana</option>
                <option value="departamento">Departamento</option>
                <option value="quinta">Quinta</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripcion</label>
            <textarea class="form-control" rows="3" formControlName="descripcion"></textarea>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Direccion</label>
              <input class="form-control" formControlName="direccion" />
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad</label>
              <input class="form-control" formControlName="ciudad" />
            </div>
            <div class="form-group">
              <label class="form-label">Latitud</label>
              <input class="form-control" type="number" step="0.000001" formControlName="latitud" />
            </div>
            <div class="form-group">
              <label class="form-label">Longitud</label>
              <input class="form-control" type="number" step="0.000001" formControlName="longitud" />
            </div>
            <div class="form-group">
              <label class="form-label">Capacidad (huespedes)</label>
              <input class="form-control" type="number" min="1" formControlName="capacidad" />
            </div>
            <div class="form-group">
              <label class="form-label">Limite de meses para reservar</label>
              <input class="form-control" type="number" min="1" formControlName="limiteMesesReserva" />
            </div>
            <div class="form-group">
              <label class="form-label">Hora check-in</label>
              <input class="form-control" type="time" formControlName="horaCheckin" />
            </div>
            <div class="form-group">
              <label class="form-label">Hora check-out</label>
              <input class="form-control" type="time" formControlName="horaCheckout" />
            </div>
            <div class="form-group">
              <label class="form-label">Precio por noche ($)</label>
              <input class="form-control" type="number" min="0" formControlName="precioNoche" />
            </div>
            <div class="form-group">
              <label class="form-label">Porcentaje de sena (%)</label>
              <input class="form-control" type="number" min="0" max="100" formControlName="porcentajeSena" />
            </div>
          </div>

          <div class="checkboxes">
            <label><input type="checkbox" formControlName="aceptaMascotas" /> Acepta mascotas</label>
            <label><input type="checkbox" formControlName="aceptaMenores" /> Acepta menores</label>
          </div>

          <div class="form-group">
            <label class="form-label">Politica de cancelacion</label>
            <select class="form-control" formControlName="politicaCancelacion">
              <option value="estandar">Estandar (segun reglas del sistema)</option>
              <option value="flexible">Flexible</option>
              <option value="estricta">Estricta</option>
            </select>
          </div>

          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Crear propiedad') }}
          </button>
        </form>
      </div>

      @if (isEdit()) {
        <div class="card images-card">
          <h3>Imagenes</h3>
          <div class="images-grid">
            @for (img of property()?.imagenes; track img.id) {
              <div class="image-item">
                <img [src]="img.url" />
                <button class="btn btn-danger btn-sm" (click)="deleteImage(img.id)">Eliminar</button>
              </div>
            }
          </div>
          <input type="file" accept="image/png,image/jpeg" (change)="onFileSelected($event)" />
          @if (uploading()) { <span class="text-muted">Subiendo imagen...</span> }
        </div>

        <div class="card blocked-card">
          <h3>Periodos bloqueados</h3>
          <div class="blocked-list">
            @for (b of blockedPeriods(); track b.id) {
              <div class="blocked-item">
                <span>{{ b.fechaDesde }} → {{ b.fechaHasta }}</span>
                <span class="text-muted">{{ b.motivo }}</span>
                <button class="btn btn-outline btn-sm" (click)="removeBlockedPeriod(b.id)">Quitar</button>
              </div>
            }
            @if (blockedPeriods().length === 0) {
              <p class="text-muted">No hay periodos bloqueados.</p>
            }
          </div>

          <div class="blocked-form">
            <input class="form-control" type="date" [(ngModel)]="newBlocked.fechaDesde" [ngModelOptions]="{standalone: true}" />
            <input class="form-control" type="date" [(ngModel)]="newBlocked.fechaHasta" [ngModelOptions]="{standalone: true}" />
            <input class="form-control" placeholder="Motivo" [(ngModel)]="newBlocked.motivo" [ngModelOptions]="{standalone: true}" />
            <button class="btn btn-secondary" (click)="addBlockedPeriod()">Bloquear</button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .form-card, .images-card, .blocked-card { padding: 24px; margin-bottom: 20px; }
    .checkboxes { display: flex; gap: 20px; margin: 6px 0 16px; font-size: 0.9rem; }
    .checkboxes label { display: flex; align-items: center; gap: 6px; }
    .images-grid { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
    .image-item { display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .image-item img { width: 130px; height: 90px; object-fit: cover; border-radius: 8px; }
    .blocked-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .blocked-item { display: flex; gap: 16px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border); }
    .blocked-form { display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 10px; }
    @media (max-width: 720px) { .blocked-form { grid-template-columns: 1fr; } }
  `],
})
export class PropertyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertiesService = inject(PropertiesService);
  private blockedPeriodsService = inject(BlockedPeriodsService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  uploading = signal(false);
  isEdit = signal(false);
  propertyId = signal<number | null>(null);
  property = signal<Property | null>(null);
  blockedPeriods = signal<BlockedPeriod[]>([]);

  newBlocked = { fechaDesde: '', fechaHasta: '', motivo: '' };

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    tipo: ['casa', Validators.required],
    descripcion: [''],
    direccion: ['', Validators.required],
    ciudad: [''],
    latitud: [0],
    longitud: [0],
    capacidad: [2, [Validators.required, Validators.min(1)]],
    limiteMesesReserva: [6, [Validators.required, Validators.min(1)]],
    horaCheckin: ['14:00'],
    horaCheckout: ['10:00'],
    precioNoche: [0, [Validators.required, Validators.min(0)]],
    porcentajeSena: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
    aceptaMascotas: [false],
    aceptaMenores: [true],
    politicaCancelacion: ['estandar'],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.propertyId.set(Number(idParam));
      this.loadProperty();
    } else {
      this.loading.set(false);
    }
  }

  loadProperty() {
    this.loading.set(true);
    this.propertiesService.findOneForAdmin(this.propertyId()!).subscribe({
      next: (p) => {
        this.property.set(p);
        this.form.patchValue({
          nombre: p.nombre,
          tipo: p.tipo,
          descripcion: p.descripcion,
          direccion: p.direccion,
          ciudad: p.ciudad,
          latitud: p.latitud,
          longitud: p.longitud,
          capacidad: p.capacidad,
          limiteMesesReserva: p.limiteMesesReserva,
          horaCheckin: p.horaCheckin?.slice(0, 5),
          horaCheckout: p.horaCheckout?.slice(0, 5),
          precioNoche: p.precioNoche,
          porcentajeSena: p.porcentajeSena,
          aceptaMascotas: p.aceptaMascotas,
          aceptaMenores: p.aceptaMenores,
          politicaCancelacion: p.politicaCancelacion,
        });
        this.loading.set(false);
        this.loadBlockedPeriods();
      },
      error: () => this.loading.set(false),
    });
  }

  loadBlockedPeriods() {
    this.blockedPeriodsService.findAll(this.propertyId()!).subscribe({
      next: (list) => this.blockedPeriods.set(list),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = this.form.getRawValue() as unknown as Partial<Property> & { tipo: PropertyType };

    const request = this.isEdit()
      ? this.propertiesService.update(this.propertyId()!, payload)
      : this.propertiesService.create(payload);

    request.subscribe({
      next: (p) => {
        this.saving.set(false);
        this.notify.success(this.isEdit() ? 'Propiedad actualizada.' : 'Propiedad creada correctamente.');
        if (!this.isEdit()) {
          this.router.navigate(['/admin/propiedades', p.id]);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(err?.error?.message || 'No se pudo guardar la propiedad.');
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.propertyId()) return;
    this.uploading.set(true);
    this.propertiesService.uploadImage(this.propertyId()!, file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.notify.success('Imagen subida correctamente.');
        this.loadProperty();
      },
      error: (err) => {
        this.uploading.set(false);
        this.notify.error(err?.error?.message || 'No se pudo subir la imagen.');
      },
    });
  }

  deleteImage(imageId: number) {
    this.propertiesService.deleteImage(this.propertyId()!, imageId).subscribe({
      next: () => {
        this.notify.success('Imagen eliminada.');
        this.loadProperty();
      },
      error: (err) => this.notify.error(err?.error?.message || 'No se pudo eliminar la imagen.'),
    });
  }

  addBlockedPeriod() {
    if (!this.newBlocked.fechaDesde || !this.newBlocked.fechaHasta || !this.newBlocked.motivo) {
      this.notify.warning('Completa fecha desde, hasta y motivo.');
      return;
    }
    this.blockedPeriodsService.create(this.propertyId()!, this.newBlocked).subscribe({
      next: () => {
        this.notify.success('Periodo bloqueado correctamente.');
        this.newBlocked = { fechaDesde: '', fechaHasta: '', motivo: '' };
        this.loadBlockedPeriods();
      },
      error: (err) => this.notify.error(err?.error?.message || 'No se pudo bloquear el periodo.'),
    });
  }

  removeBlockedPeriod(id: number) {
    this.blockedPeriodsService.remove(id).subscribe({
      next: () => {
        this.notify.success('Periodo eliminado.');
        this.loadBlockedPeriods();
      },
      error: (err) => this.notify.error(err?.error?.message || 'No se pudo eliminar el periodo.'),
    });
  }
}
