import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Api, Auth, Page, message, money, dateLabel } from './core';
import { StatusComponent } from './shared';
type ReservationSummary = {
  id: number;
  propiedad_nombre: string;
  fecha_desde: string;
  fecha_hasta: string;
  cantidad_huespedes: number;
  estado: string;
  importe_total: string;
};
@Component({
  standalone: true,
  imports: [RouterLink, StatusComponent],
  template: `<div class="page">
    <div class="section-heading">
      <div>
        <span class="eyebrow">TUS PRÓXIMAS HISTORIAS</span>
        <h1>{{ admin ? 'Reservas' : 'Mis reservas' }}</h1>
      </div>
      <a routerLink="/propiedades" class="button secondary">Explorar alojamientos ↗</a>
    </div>
    <app-status [error]="error" [loading]="loading" />
    @if (!loading && !rows.length && !error) {
      <div class="empty">
        <h2>Todavía no hay reservas</h2>
        <p>Tu próxima escapada puede empezar hoy.</p>
      </div>
    }
    <div class="reservation-list">
      @for (r of rows; track r.id) {
        <a
          class="reservation-row"
          [routerLink]="[admin ? '/admin/reservas' : '/mis-reservas', r.id]"
          ><div class="reservation-icon">⌂</div>
          <div>
            <h3>{{ r.propiedad_nombre }}</h3>
            <p class="muted">
              {{ date(r.fecha_desde) }} → {{ date(r.fecha_hasta) }} ·
              {{ r.cantidad_huespedes }} huéspedes
            </p>
          </div>
          <span class="badge" [attr.data-state]="r.estado">{{ r.estado }}</span>
          <div>
            <strong>{{ money(r.importe_total) }}</strong
            ><small class="muted">Total de la estadía</small>
          </div>
          <span>↗</span></a
        >
      }
    </div>
    @if (total > limit) {
      <nav class="pagination" aria-label="Paginación de reservas">
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
export class ReservationsComponent implements OnInit {
  api = inject(Api);
  auth = inject(Auth);
  admin = this.auth.user()?.role === 'ADMINISTRADOR';
  rows: ReservationSummary[] = [];
  total = 0;
  page = 1;
  readonly limit = 20;
  get pageCount() {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }
  error = '';
  loading = true;
  money = money;
  date = dateLabel;
  async ngOnInit() {
    await this.load();
  }
  async load(page = this.page) {
    this.loading = true;
    this.error = '';
    try {
      const path = this.admin ? '/admin/reservations' : '/reservations/me';
      const result = await this.api.request<Page<ReservationSummary>>(
        `${path}?page=${page}&limit=${this.limit}`,
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
  template: `<div class="page narrow">
    <a [routerLink]="admin ? '/admin/reservas' : '/mis-reservas'" class="back"
      >← Volver a reservas</a
    >
    <h1>Tu reserva #{{ id }}</h1>
    <app-status [loading]="loading" [error]="error" [success]="success" />
    @if (r) {
      <article class="surface">
        <div class="section-heading">
          <h2>{{ r.propiedad.nombre }}</h2>
          <span class="badge" [attr.data-state]="r.estado">{{ r.estado }}</span>
        </div>
        <p>{{ r.propiedad.direccion }}</p>
        <div class="stats">
          <div>
            <small>INGRESO</small><strong>{{ date(r.fecha_desde) }}</strong
            ><span>{{ r.propiedad.hora_checkin.slice(0, 5) }} h</span>
          </div>
          <div>
            <small>EGRESO</small><strong>{{ date(r.fecha_hasta) }}</strong
            ><span>{{ r.propiedad.hora_checkout.slice(0, 5) }} h</span>
          </div>
          <div>
            <small>HUÉSPEDES</small><strong>{{ r.cantidad_huespedes }}</strong>
          </div>
        </div>
        <dl class="costs">
          <div>
            <dt>Total</dt>
            <dd>{{ money(r.importe_total) }}</dd>
          </div>
          <div>
            <dt>Seña</dt>
            <dd>{{ money(r.importe_sena) }}</dd>
          </div>
        </dl>
        @if (r.estado === 'TEMPORAL' && remaining > 0) {
          <div class="notice">
            Reserva creada. Tenés 1 h 30 min para pagar la seña.<br />Tiempo restante:
            <strong>{{ countdown }}</strong>
          </div>
          @if (!admin) {
            <button [disabled]="busy" (click)="pay()">Pagar seña con Mercado Pago ↗</button>
            <p class="small muted">Checkout de prueba. No uses dinero real.</p>
          }
        }
        @if (r.estado === 'VENCIDA' || (r.estado === 'TEMPORAL' && remaining <= 0)) {
          <p class="notice">La reserva venció. Volvé a consultar disponibilidad para crear otra.</p>
        }
        @if (r.estado === 'CONFIRMADA') {
          <div class="notice success">El pago fue aprobado. Tu reserva está confirmada.</div>
        }
        <button class="text-button" (click)="load()" [disabled]="busy">
          Actualizar estado del pago
        </button>
        <h3>Pagos</h3>
        @if (!r.pagos.length) {
          <p class="muted">Aún no se registraron pagos.</p>
        }
        @for (p of r.pagos; track p.id) {
          <p>
            {{ date(p.fecha) }} · {{ money(p.monto) }} · <strong>{{ p.estado }}</strong>
          </p>
        }
        @if (r.cancelacion) {
          <div class="notice">
            <strong>Reserva cancelada</strong>
            <p>{{ r.cancelacion.motivo }}</p>
            @if (r.cancelacion.requiere_reintegro) {
              <p>
                Requiere revisión de reintegro por el administrador. Rentify no procesa
                devoluciones.
              </p>
            }
          </div>
        }
        @if (r.estado === 'TEMPORAL' || r.estado === 'CONFIRMADA') {
          <details class="cancel">
            <summary>Cancelar reserva</summary>
            <p class="small muted">
              Hasta 72 horas antes del ingreso. No se puede cancelar una estadía iniciada.
            </p>
            <form (ngSubmit)="cancel()">
              <label
                >Motivo<textarea
                  name="reason"
                  [(ngModel)]="reason"
                  minlength="3"
                  maxlength="500"
                  required
                ></textarea>
              </label>
              @if (admin) {
                <label class="checkbox"
                  ><input type="checkbox" name="exceptional" [(ngModel)]="exceptional" />Cancelación
                  excepcional</label
                >
              }
              <button class="danger" [disabled]="busy">Confirmar cancelación</button>
            </form>
          </details>
        }
      </article>
    }
  </div>`,
})
export class ReservationDetailComponent implements OnInit, OnDestroy {
  api = inject(Api);
  auth = inject(Auth);
  route = inject(ActivatedRoute);
  id = Number(this.route.snapshot.paramMap.get('id'));
  admin = this.auth.user()?.role === 'ADMINISTRADOR';
  r: any;
  loading = true;
  busy = false;
  error = '';
  success = '';
  reason = '';
  exceptional = false;
  remaining = 0;
  timer?: ReturnType<typeof setInterval>;
  money = money;
  date = dateLabel;
  get countdown() {
    return `${Math.floor(this.remaining / 60)} min ${this.remaining % 60} s`;
  }
  async ngOnInit() {
    await this.load();
    this.timer = setInterval(() => this.tick(), 1000);
  }
  ngOnDestroy() {
    clearInterval(this.timer);
  }
  tick() {
    this.remaining = this.r
      ? Math.max(0, Math.ceil((Date.parse(this.r.fecha_vencimiento_temporal) - Date.now()) / 1000))
      : 0;
  }
  async load() {
    this.error = '';
    try {
      this.r = await this.api.request(`/reservations/${this.id}`);
      this.tick();
    } catch (e) {
      this.error = message(e);
    } finally {
      this.loading = false;
    }
  }
  async pay() {
    this.busy = true;
    this.error = '';
    try {
      const result = await this.api.request(`/reservations/${this.id}/payment`, 'POST');
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || !/(^|\.)mercadopago\.(com|com\.ar)$/.test(url.hostname))
        throw new Error('El checkout recibido no es válido.');
      location.assign(url.toString());
    } catch (e) {
      this.error = message(e);
    } finally {
      this.busy = false;
    }
  }
  async cancel() {
    this.busy = true;
    this.error = '';
    try {
      await this.api.request(
        `${this.admin ? '/admin' : ''}/reservations/${this.id}/cancel`,
        'POST',
        { motivo: this.reason, es_excepcional: this.exceptional },
      );
      this.success = 'La reserva fue cancelada.';
      await this.load();
    } catch (e) {
      this.error = message(e);
    } finally {
      this.busy = false;
    }
  }
}
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, StatusComponent],
  template: `<div class="page narrow">
    <span class="eyebrow">TU CUENTA</span>
    <h1>Mi perfil</h1>
    <article class="surface">
      <app-status [error]="error" [success]="success" [loading]="busy" />
      <form (ngSubmit)="save()">
        <div class="form-grid">
          <label
            >Nombre<input name="nombre" [(ngModel)]="data.nombre" minlength="2" required /></label
          ><label
            >Apellido<input name="apellido" [(ngModel)]="data.apellido" minlength="2" required
          /></label>
        </div>
        <label>Correo electrónico<input [value]="auth.user()?.email" disabled /></label>
        @if (auth.user()?.role === 'CLIENTE') {
          <label>Teléfono<input name="telefono" [(ngModel)]="data.telefono" required /></label>
        }
        <button [disabled]="busy">Guardar cambios</button>
      </form>
      <a class="text-link" routerLink="/cuenta/contrasena">Cambiar contraseña →</a>
    </article>
  </div>`,
})
export class ProfileComponent {
  auth = inject(Auth);
  api = inject(Api);
  data = {
    nombre: this.auth.user()?.nombre || '',
    apellido: this.auth.user()?.apellido || '',
    ...(this.auth.user()?.role === 'CLIENTE' ? { telefono: this.auth.user()?.telefono || '' } : {}),
  };
  error = '';
  success = '';
  busy = false;
  async save() {
    this.busy = true;
    this.error = '';
    try {
      await this.api.request('/auth/me', 'PATCH', this.data);
      await this.auth.refresh();
      this.success = 'Perfil actualizado.';
    } catch (e) {
      this.error = message(e);
    } finally {
      this.busy = false;
    }
  }
}
