import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Api, Auth, Page, Property, message, money, dateLabel } from './core';
import { StatusComponent } from './shared';
@Component({
  standalone: true,
  imports: [RouterLink, StatusComponent, FormsModule],
  template: `<div class="page">
    <div class="section-heading">
      <div>
        <span class="eyebrow">ESPACIO DE ADMINISTRACIÓN</span>
        <h1>{{ dashboard ? 'Hola, ' + auth.user()?.nombre : 'Reportes' }}</h1>
        <p class="muted">Una mirada a tus propiedades y reservas.</p>
      </div>
      <a routerLink="/admin/propiedades/nueva" class="button">Nueva propiedad +</a>
    </div>
    <form class="search-panel" (ngSubmit)="load()">
      <label>Desde<input name="desde" type="date" [(ngModel)]="from" /></label
      ><label>Hasta (exclusivo)<input name="hasta" type="date" [(ngModel)]="to" /></label
      ><label
        >Propiedad<select name="property" [(ngModel)]="propertyId">
          <option value="">Todas</option>
          @for (p of properties; track p.id) {
            <option [value]="p.id">{{ p.nombre }}</option>
          }
        </select></label
      ><label
        >Reporte<select name="kind" [(ngModel)]="kind">
          <option value="performance">Desempeño</option>
          <option value="reservations">Reservas</option>
          <option value="income">Ingresos</option>
          <option value="occupancy">Ocupación</option>
          <option value="cancellations">Cancelaciones</option>
        </select></label
      ><button [disabled]="loading">Consultar</button>
    </form>
    <app-status [error]="error" [loading]="loading" />
    @if (report) {
      <div class="metric-grid">
        <article>
          <small>RESERVAS CONFIRMADAS</small
          ><strong>{{ report.resumen.reservas_confirmadas }}</strong
          ><span>En el período seleccionado</span>
        </article>
        <article>
          <small>INGRESOS APROBADOS</small><strong>{{ money(report.resumen.ingresos) }}</strong
          ><span>Pagos de señas recibidos</span>
        </article>
        <article>
          <small>OCUPACIÓN</small><strong>{{ report.resumen.ocupacion }}<small>%</small></strong
          ><span>{{ report.resumen.noches_ocupadas }} noches ocupadas</span>
        </article>
        <article>
          <small>CANCELACIONES</small><strong>{{ report.resumen.cancelaciones }}</strong
          ><span>Gestionadas en el período</span>
        </article>
      </div>
      <article class="surface">
        <h2>
          {{
            kind === 'occupancy' || kind === 'performance'
              ? 'Ocupación por propiedad'
              : 'Detalle del reporte'
          }}
        </h2>
        @if (kind === 'occupancy' || kind === 'performance') {
          <div class="chart">
            @for (row of report.filas; track $index) {
              <div class="bar-row">
                <span>{{ row.propiedad }}</span>
                <div class="bar-track"><div [style.width.%]="row.ocupacion"></div></div>
                <b>{{ row.ocupacion }}%</b>
              </div>
            }
          </div>
        }
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                @for (key of columns; track key) {
                  <th>{{ label(key) }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of report.filas; track $index) {
                <tr>
                  @for (key of columns; track key) {
                    <td>{{ cell(row[key]) }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!report.filas.length) {
          <p class="empty">No hay datos para el período elegido.</p>
        }
      </article>
    }
  </div>`,
})
export class ReportsComponent implements OnInit {
  api = inject(Api);
  auth = inject(Auth);
  route = inject(ActivatedRoute);
  dashboard = this.route.snapshot.data['dashboard'];
  properties: Pick<Property, 'id' | 'nombre'>[] = [];
  report: any;
  kind = 'performance';
  from = '';
  to = '';
  propertyId = '';
  loading = false;
  error = '';
  money = money;
  get columns() {
    return this.report?.filas?.length
      ? Object.keys(this.report.filas[0]).filter(
          (k) =>
            ![
              'propiedad_id',
              'cliente_id',
              'id_transaccion_externa',
              'administrador_id',
              'reserva_id',
            ].includes(k),
        )
      : [];
  }
  async ngOnInit() {
    try {
      this.properties = await this.api.request("/admin/properties/options");
    } catch (e) {
      this.error = message(e);
    }
    await this.load();
  }
  async load() {
    this.loading = true;
    this.error = '';
    try {
      const params = new URLSearchParams();
      if (this.from) params.set('fecha_desde', this.from);
      if (this.to) params.set('fecha_hasta', this.to);
      if (this.propertyId) params.set('propiedad_id', this.propertyId);
      this.report = await this.api.request(`/admin/reports/${this.kind}?${params}`);
    } catch (e) {
      this.error = message(e);
    } finally {
      this.loading = false;
    }
  }
  label(key: string) {
    return key.replaceAll('_', ' ');
  }
  cell(value: any) {
    return typeof value === 'boolean' ? (value ? 'Sí' : 'No') : (value ?? '—');
  }
}
@Component({
  standalone: true,
  imports: [RouterLink, StatusComponent],
  template: `<div class="page">
    <div class="section-heading">
      <div>
        <span class="eyebrow">TUS ALOJAMIENTOS</span>
        <h1>Propiedades</h1>
      </div>
      <a routerLink="/admin/propiedades/nueva" class="button">Nueva propiedad +</a>
    </div>
    <app-status [error]="error" [loading]="loading" />
    <div class="table-scroll surface">
      <table>
        <thead>
          <tr>
            <th>Alojamiento</th>
            <th>Capacidad</th>
            <th>Precio / noche</th>
            <th>Seña</th>
            <th>Estado</th>
            <th>Gestión</th>
          </tr>
        </thead>
        <tbody>
          @for (p of rows; track p.id) {
            <tr>
              <td>
                <strong>{{ p.nombre }}</strong
                ><small class="muted">{{ p.direccion }}</small>
              </td>
              <td>{{ p.capacidad }} personas</td>
              <td>{{ money(p.precio_noche) }}</td>
              <td>{{ p.porcentaje_sena }}%</td>
              <td>
                <span class="badge">{{ p.estado }}</span>
              </td>
              <td><a [routerLink]="['/admin/propiedades', p.id]">Editar →</a></td>
            </tr>
          }
        </tbody>
      </table>
      @if (!loading && !rows.length) {
        <p class="empty">Todavía no cargaste propiedades.</p>
      }
    </div>
    @if (total > limit) {
      <nav class="pagination" aria-label="Paginación de propiedades">
        <button class="secondary" [disabled]="loading || page === 1" (click)="load(page - 1)">
          Anterior
        </button>
        <span>Página {{ page }} de {{ pageCount }}</span>
        <button class="secondary" [disabled]="loading || page >= pageCount" (click)="load(page + 1)">
          Siguiente
        </button>
      </nav>
    }
  </div>`,
})
export class AdminPropertiesComponent implements OnInit {
  api = inject(Api);
  rows: Property[] = [];
  total = 0;
  page = 1;
  readonly limit = 12;
  get pageCount() {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }
  error = '';
  loading = true;
  money = money;
  async ngOnInit() {
    await this.load();
  }
  async load(page = this.page) {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.api.request<Page<Property>>(
        `/admin/properties?page=${page}&limit=${this.limit}`,
      );
      this.rows = result.items;
      this.total = result.total;
      this.page = result.page;
    } catch (e) {
      this.error = message(e);
    } finally {
      this.loading = false;
    }
  }
}
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, StatusComponent],
  template: `<div class="page">
    <a routerLink="/admin/propiedades" class="back">← Propiedades</a>
    <h1>{{ id ? 'Editar propiedad' : 'Nuevo lugar, nuevas historias' }}</h1>
    <app-status [loading]="loading" [error]="error" [success]="success" />
    <div class="editor-layout">
      <article class="surface">
        <h2>Información del alojamiento</h2>
        <form (ngSubmit)="save()">
          <div class="form-grid">
            <label
              >Nombre<input name="nombre" [(ngModel)]="data.nombre" required minlength="3" /></label
            ><label
              >Tipo<select name="tipo" [(ngModel)]="data.tipo">
                <option>casa</option>
                <option>departamento</option>
                <option>cabaña</option>
                <option>quinta</option>
              </select></label
            >
          </div>
          <label
            >Descripción<textarea
              name="descripcion"
              [(ngModel)]="data.descripcion"
              required
              minlength="10"
              rows="4"
            ></textarea></label
          ><label
            >Dirección<input name="direccion" [(ngModel)]="data.direccion" required minlength="5"
          /></label>
          <div class="form-grid">
            <label
              >Latitud<input
                name="latitud"
                type="number"
                step="any"
                [(ngModel)]="data.latitud"
                required /></label
            ><label
              >Longitud<input
                name="longitud"
                type="number"
                step="any"
                [(ngModel)]="data.longitud"
                required /></label
            ><label
              >Huéspedes<input
                name="capacidad"
                type="number"
                min="1"
                max="100"
                [(ngModel)]="data.capacidad"
                required /></label
            ><label
              >Habitaciones<input
                name="habitaciones"
                type="number"
                min="0"
                [(ngModel)]="data.cantidad_habitaciones"
                required /></label
            ><label
              >Baños<input
                name="banos"
                type="number"
                min="1"
                [(ngModel)]="data.cantidad_banos"
                required /></label
            ><label
              >Anticipación máxima (meses)<input
                name="limite"
                type="number"
                min="1"
                max="36"
                [(ngModel)]="data.limite_meses_reserva"
                required /></label
            ><label
              >Hora de ingreso<input
                name="checkin"
                type="time"
                [(ngModel)]="data.hora_checkin"
                required /></label
            ><label
              >Hora de egreso<input
                name="checkout"
                type="time"
                [(ngModel)]="data.hora_checkout"
                required
            /></label>
          </div>
          <div class="inline">
            <label class="checkbox"
              ><input name="mascotas" type="checkbox" [(ngModel)]="data.acepta_mascotas" />Acepta
              mascotas</label
            ><label class="checkbox"
              ><input name="menores" type="checkbox" [(ngModel)]="data.acepta_menores" />Acepta
              menores</label
            >
          </div>
          <h3>Precio y disponibilidad</h3>
          <div class="form-grid">
            <label
              >Precio por noche (ARS)<input
                name="precio"
                type="number"
                min="0.01"
                step="0.01"
                [(ngModel)]="data.precio_noche"
                required /></label
            ><label
              >Seña (%)<input
                name="sena"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                [(ngModel)]="data.porcentaje_sena"
                required
            /></label>
          </div>
          <label
            >Estado<select name="estado" [(ngModel)]="data.estado">
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
            </select></label
          ><button [disabled]="busy">Guardar propiedad</button>
        </form>
      </article>
      @if (id) {
        <aside>
          <article class="surface">
            <h2>Imágenes</h2>
            <p class="small muted">JPG o PNG · Máximo 5 MB por imagen</p>
            <label class="upload"
              >Agregar imagen<input
                type="file"
                accept="image/jpeg,image/png"
                (change)="upload($event)"
                [disabled]="busy"
            /></label>
            <div class="image-manager">
              @for (img of images; track img.id) {
                <div>
                  <img [src]="img.url" alt="Imagen de la propiedad" /><label
                    >Orden<input
                      type="number"
                      min="0"
                      [ngModel]="img.orden"
                      (ngModelChange)="orderImage(img.id, $event)" /></label
                  ><button class="text-button" (click)="removeImage(img.id)" [disabled]="busy">
                    Eliminar
                  </button>
                </div>
              }
            </div>
          </article>
          <article class="surface">
            <h2>Períodos bloqueados</h2>
            <form (ngSubmit)="saveBlock()">
              <label
                >Desde<input
                  type="date"
                  name="block_from"
                  [(ngModel)]="block.fecha_desde"
                  required /></label
              ><label
                >Hasta (exclusivo)<input
                  type="date"
                  name="block_to"
                  [(ngModel)]="block.fecha_hasta"
                  required /></label
              ><label
                >Motivo<input
                  name="block_reason"
                  [(ngModel)]="block.motivo"
                  required
                  minlength="3" /></label
              ><button [disabled]="busy">
                {{ blockId ? 'Actualizar período' : 'Bloquear fechas' }}
              </button>
              @if (blockId) {
                <button type="button" class="text-button" (click)="resetBlock()">
                  Cancelar edición
                </button>
              }
            </form>
            @for (b of blocks; track b.id) {
              <div class="blocked-row">
                <b>{{ b.fecha_desde }} → {{ b.fecha_hasta }}</b>
                <p>{{ b.motivo }}</p>
                <button class="text-button" (click)="editBlock(b)">Editar</button
                ><button class="text-button" (click)="removeBlock(b.id)" [disabled]="busy">
                  Eliminar
                </button>
              </div>
            }
          </article>
        </aside>
      }
    </div>
  </div>`,
})
export class PropertyEditorComponent implements OnInit {
  api = inject(Api);
  route = inject(ActivatedRoute);
  router = inject(Router);
  id = Number(this.route.snapshot.paramMap.get('id')) || 0;
  data: Record<string, any> = {
    nombre: '',
    tipo: 'casa',
    descripcion: '',
    direccion: '',
    latitud: -31.42,
    longitud: -64.18,
    capacidad: 2,
    cantidad_habitaciones: 1,
    cantidad_banos: 1,
    hora_checkin: '15:00',
    hora_checkout: '10:00',
    acepta_mascotas: false,
    acepta_menores: true,
    limite_meses_reserva: 12,
    precio_noche: '50000',
    porcentaje_sena: '30',
    estado: 'ACTIVA',
  };
  images: any[] = [];
  blocks: any[] = [];
  block = { fecha_desde: '', fecha_hasta: '', motivo: '' };
  blockId = 0;
  loading = false;
  busy = false;
  error = '';
  success = '';
  async ngOnInit() {
    if (this.id) {
      this.loading = true;
      try {
        await this.reload();
      } catch (e) {
        this.error = message(e);
      } finally {
        this.loading = false;
      }
    }
  }
  async reload() {
    const p = await this.api.request<Property>(`/admin/properties/${this.id}`);
    this.images = p.imagenes;
    for (const key of Object.keys(this.data)) this.data[key] = (p as any)[key];
    this.data['latitud'] = Number(p.latitud);
    this.data['longitud'] = Number(p.longitud);
    this.blocks = await this.api.request(`/admin/properties/${this.id}/blocked-periods`);
  }
  async action(fn: () => Promise<void>) {
    this.busy = true;
    this.error = '';
    this.success = '';
    try {
      await fn();
    } catch (e) {
      this.error = message(e);
    } finally {
      this.busy = false;
    }
  }
  save() {
    return this.action(async () => {
      const body = {
        ...this.data,
        precio_noche: String(this.data['precio_noche']),
        porcentaje_sena: String(this.data['porcentaje_sena']),
      };
      const p = await this.api.request(
        this.id ? `/admin/properties/${this.id}` : '/admin/properties',
        this.id ? 'PATCH' : 'POST',
        body,
      );
      this.success = 'Propiedad guardada.';
      if (!this.id) {
        this.id = p.id;
        await this.router.navigate(['/admin/propiedades', p.id]);
      }
      await this.reload();
    });
  }
  upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    return this.action(async () => {
      const form = new FormData();
      form.append('file', file);
      await this.api.request(`/admin/properties/${this.id}/images`, 'POST', form);
      await this.reload();
      this.success = 'Imagen agregada.';
    });
  }
  removeImage(id: number) {
    return this.action(async () => {
      await this.api.request(`/admin/properties/${this.id}/images/${id}`, 'DELETE');
      await this.reload();
    });
  }
  orderImage(id: number, orden: number) {
    return this.action(async () => {
      await this.api.request(`/admin/properties/${this.id}/images/${id}`, 'PATCH', { orden });
      await this.reload();
    });
  }
  saveBlock() {
    return this.action(async () => {
      await this.api.request(
        `/admin/properties/${this.id}/blocked-periods${this.blockId ? '/' + this.blockId : ''}`,
        this.blockId ? 'PATCH' : 'POST',
        this.block,
      );
      this.resetBlock();
      await this.reload();
      this.success = 'Período bloqueado guardado.';
    });
  }
  editBlock(b: any) {
    this.blockId = b.id;
    this.block = { fecha_desde: b.fecha_desde, fecha_hasta: b.fecha_hasta, motivo: b.motivo };
  }
  resetBlock() {
    this.blockId = 0;
    this.block = { fecha_desde: '', fecha_hasta: '', motivo: '' };
  }
  removeBlock(id: number) {
    return this.action(async () => {
      await this.api.request(`/admin/properties/${this.id}/blocked-periods/${id}`, 'DELETE');
      await this.reload();
    });
  }
}
@Component({
  standalone: true,
  imports: [RouterLink, StatusComponent],
  template: `<div class="page">
    <span class="eyebrow">GESTIÓN</span>
    <h1>{{ payments ? 'Pagos' : 'Cancelaciones' }}</h1>
    <app-status [error]="error" [loading]="loading" />
    <div class="surface table-scroll">
      <table>
        <thead>
          <tr>
            <th>Reserva</th>
            <th>Propiedad</th>
            <th>Fecha</th>
            @if (payments) {
              <th>Monto</th>
              <th>Estado</th>
              <th>Revisión</th>
            } @else {
              <th>Motivo</th>
              <th>Actor</th>
              <th>Excepcional</th>
              <th>Reintegro</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (r of rows; track r.id) {
            <tr>
              <td>
                <a [routerLink]="['/admin/reservas', r.reserva_id]">#{{ r.reserva_id }} ↗</a>
              </td>
              <td>{{ r.propiedad_nombre }}</td>
              <td>{{ date(r.fecha) }}</td>
              @if (payments) {
                <td>{{ money(r.monto) }}</td>
                <td>
                  <span class="badge">{{ r.estado }}</span>
                </td>
                <td>{{ r.requiere_revision ? 'Requiere conciliación' : '—' }}</td>
              } @else {
                <td>{{ r.motivo }}</td>
                <td>{{ r.tipo_usuario }}</td>
                <td>{{ r.es_excepcional ? 'Sí' : 'No' }}</td>
                <td>{{ r.requiere_reintegro ? 'Revisión administrativa' : 'No' }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
      @if (!loading && !rows.length) {
        <p class="empty">Todavía no hay registros.</p>
      }
    </div>
    <p class="small muted">
      Rentify no realiza reintegros ni devoluciones. Los pagos aprobados fuera de término requieren
      conciliación administrativa.
    </p>
  </div>`,
})
export class TransactionsComponent implements OnInit {
  api = inject(Api);
  route = inject(ActivatedRoute);
  payments = this.route.snapshot.data['payments'];
  rows: any[] = [];
  loading = true;
  error = '';
  money = money;
  date = dateLabel;
  async ngOnInit() {
    try {
      this.rows = await this.api.request(
        this.payments ? '/admin/payments' : '/admin/cancellations',
      );
    } catch (e) {
      this.error = message(e);
    } finally {
      this.loading = false;
    }
  }
}
