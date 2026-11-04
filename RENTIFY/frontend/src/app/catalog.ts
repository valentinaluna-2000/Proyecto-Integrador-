import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Decimal from 'decimal.js';
import { Api, Auth, Page, Property, message, money } from './core';
import { PropertyCardComponent, StatusComponent } from './shared';
import { AvailabilityCalendarComponent } from './calendar';
@Component({
  standalone: true,
  imports: [FormsModule, PropertyCardComponent, StatusComponent],
  template: ` <section class="page catalog-page">
      <div class="section-heading">
        <div>
          <span class="eyebrow">CATÁLOGO DE PROPIEDADES</span>
          <h1>Encontrá el lugar indicado para tu estadía.</h1>
        </div>
        <span class="muted">{{ total }} alojamientos encontrados</span>
      </div>
      <form class="search-panel" (ngSubmit)="search()">
        <label class="wide"
          >¿A dónde vamos?<input
            name="ubicacion"
            [(ngModel)]="filters.ubicacion"
            placeholder="Ciudad, zona o alojamiento" /></label
        ><label>Ingreso<input name="desde" type="date" [(ngModel)]="filters.fecha_desde" /></label
        ><label>Egreso<input name="hasta" type="date" [(ngModel)]="filters.fecha_hasta" /></label
        ><label
          >Huéspedes<input
            name="capacidad"
            type="number"
            min="1"
            [(ngModel)]="filters.capacidad"
            placeholder="2" /></label
        ><button [disabled]="loading">Buscar <span>↗</span></button>
        <details class="filter-details">
          <summary>Más filtros</summary>
          <div class="filters-extra">
            <label
              >Precio mínimo<input
                name="min"
                type="number"
                min="0"
                [(ngModel)]="filters.precio_min" /></label
            ><label
              >Precio máximo<input
                name="max"
                type="number"
                min="0"
                [(ngModel)]="filters.precio_max" /></label
            ><label
              >Mascotas<select name="pets" [(ngModel)]="filters.mascotas">
                <option value="">Indistinto</option>
                <option value="true">Acepta mascotas</option>
                <option value="false">Sin mascotas</option>
              </select></label
            ><label
              >Menores<select name="kids" [(ngModel)]="filters.menores">
                <option value="">Indistinto</option>
                <option value="true">Acepta menores</option>
                <option value="false">Solo adultos</option>
              </select></label
            >
          </div>
        </details>
      </form>
      <app-status [loading]="loading" [error]="error" />
      @if (!loading && !error && !properties.length) {
        <div class="empty">
          <h3>Tu lugar está por aparecer</h3>
          <p>Probá con otras fechas o una ubicación diferente.</p>
        </div>
      }
      <div class="property-grid">
        @for (p of properties; track p.id) {
          <app-property-card [property]="p" />
        }
      </div>
      @if (total > limit) {
        <nav class="pagination" aria-label="Paginación del catálogo">
          <button class="secondary" [disabled]="loading || page === 1" (click)="loadPage(page - 1)">
            Anterior
          </button>
          <span>Página {{ page }} de {{ pageCount }}</span>
          <button class="secondary" [disabled]="loading || page >= pageCount" (click)="loadPage(page + 1)">
            Siguiente
          </button>
        </nav>
      }
    </section>`,
})
export class CatalogComponent implements OnInit {
  api = inject(Api);
  route = inject(ActivatedRoute);
  properties: Property[] = [];
  total = 0;
  page = 1;
  readonly limit = 12;
  get pageCount() {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }
  loading = false;
  error = '';
  filters: Record<string, any> = { ubicacion: '', mascotas: '', menores: '' };
  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    for (const key of ['ubicacion', 'fecha_desde', 'fecha_hasta', 'capacidad']) {
      const value = params.get(key);
      if (value) this.filters[key] = value;
    }
    void this.search();
  }
  async search() {
    this.page = 1;
    await this.loadPage();
  }
  async loadPage(page = this.page) {
    this.loading = true;
    this.error = '';
    try {
      const q = new URLSearchParams(
        Object.entries(this.filters)
          .filter(([, v]) => v !== '' && v !== null && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      );
      q.set('page', String(page));
      q.set('limit', String(this.limit));
      const result = await this.api.request<Page<Property>>(`/properties?${q}`);
      this.properties = result.items;
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
  imports: [FormsModule, RouterLink, StatusComponent, AvailabilityCalendarComponent],
  template: ` <div class="page">
    <a routerLink="/propiedades" class="back">← Todos los alojamientos</a
    ><app-status [loading]="loading" [error]="error" [success]="success" />
    @if (property; as p) {
      <div class="detail-heading">
        <div>
          <span class="eyebrow">{{ p.tipo }} · {{ p.capacidad }} HUÉSPEDES</span>
          <h1>{{ p.nombre }}</h1>
          <p class="muted">⌖ {{ p.direccion }}</p>
        </div>
        <span class="tag">Una pausa, a tu manera</span>
      </div>
      <div class="gallery">
        @for (
          img of p.imagenes.length ? p.imagenes : [{ url: '/house.svg', id: 0 }];
          track img.id
        ) {
          <img [src]="img.url" [alt]="p.nombre" (error)="fallback($event)" />
        }
      </div>
      <div class="detail-layout">
        <div>
          <section class="detail-section">
            <h2>Tu próximo lugar</h2>
            <div class="amenities">
              <span>{{ p.capacidad }} huéspedes</span
              ><span>{{ p.cantidad_habitaciones }} habitaciones</span
              ><span>{{ p.cantidad_banos }} baños</span
              ><span>{{ p.acepta_mascotas ? 'Admite mascotas' : 'Sin mascotas' }}</span
              ><span>{{ p.acepta_menores ? 'Admite menores' : 'Solo adultos' }}</span>
            </div>
            <p class="description">{{ p.descripcion }}</p>
            <p>
              Ingreso desde las {{ p.hora_checkin.slice(0, 5) }} · Egreso hasta las
              {{ p.hora_checkout.slice(0, 5) }}
            </p>
            <p class="muted small">Podés reservar con hasta {{ p.limite_meses_reserva }} meses de anticipación.</p>
          </section>
          <section class="detail-section">
            <h2>Por acá vas a estar</h2>
            <p>{{ p.direccion }}</p>
            @if (mapUrl) {
              <iframe
                title="Ubicación de la propiedad en Google Maps"
                [src]="mapUrl"
                width="100%"
                height="310"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                (error)="mapUrl = null"
              ></iframe>
            } @else {
              <p class="notice">
                El mapa no está disponible. Podés consultar la dirección indicada arriba.
              </p>
            }
          </section>
          <section class="detail-section">
            <h2>El clima durante tu estadía</h2>
            @if (weather?.disponible) {
              <div class="weather-days">
                @for (day of weather.daily.time; track day; let i = $index) {
                  <div>
                    <b>{{ day.slice(5) }}</b
                    ><span
                      >{{ weather.daily.temperature_2m_min[i] }}° /
                      {{ weather.daily.temperature_2m_max[i] }}°</span
                    ><small>{{ condition(weather.daily.weather_code[i]) }}</small
                    ><small
                      >{{ weather.daily.precipitation_sum[i] }} mm ·
                      {{ weather.daily.wind_speed_10m_max[i] }} km/h</small
                    >
                  </div>
                }
              </div>
            } @else {
              <p class="muted">
                {{ weather?.message || 'Elegí tus fechas para consultar el pronóstico.' }}
              </p>
            }
          </section>
        </div>
        <aside class="booking-card">
          <strong class="price">{{ money(p.precio_noche) }} <small>/ noche</small></strong>
          <p class="muted small">Elegí ingreso y egreso directamente en el calendario.</p>
          <form (ngSubmit)="reserve()">
            <app-availability-calendar
              [propertyId]="p.id"
              [maxMonths]="p.limite_meses_reserva"
              [from]="from"
              [to]="to"
              (selected)="selectDates($event.from, $event.to)"
              (state)="calendarState($event.ready, $event.error)"
            ></app-availability-calendar>
            <label
              >Huéspedes<input
                type="number"
                name="guests"
                min="1"
                [max]="p.capacidad"
                [(ngModel)]="guests"
                required /></label>
            @if (available !== null) {
              <p [class]="available ? 'available' : 'unavailable'">
                {{
                  available ? '✓ Disponible para tus fechas' : 'Estas fechas no están disponibles.'
                }}
              </p>
            }
            @if (nights > 0) {
              <dl class="costs">
                <div>
                  <dt>{{ nights }} noches</dt>
                  <dd>{{ money(total) }}</dd>
                </div>
                <div>
                  <dt>Seña ({{ p.porcentaje_sena }}%)</dt>
                  <dd>{{ money(deposit) }}</dd>
                </div>
              </dl>
            }
            <button class="full" [disabled]="busy || !calendarReady || !from || !to || available !== true">
              {{ busy ? 'Procesando…' : 'Reservar mi estadía' }} ↗
            </button>
            <p class="small muted center">
              Tenés 1 h 30 min para pagar la seña desde que creás la reserva.
            </p>
          </form>
          <hr />
          <p class="small muted">
            Cancelación normal hasta 72 horas antes del ingreso. Los reintegros se gestionan con el
            administrador.
          </p>
        </aside>
      </div>
    }
  </div>`,
})
export class DetailComponent implements OnInit {
  @ViewChild(AvailabilityCalendarComponent) calendar?: AvailabilityCalendarComponent;
  api = inject(Api);
  auth = inject(Auth);
  route = inject(ActivatedRoute);
  router = inject(Router);
  sanitizer = inject(DomSanitizer);
  property?: Property;
  loading = true;
  busy = false;
  error = '';
  success = '';
  from = '';
  to = '';
  guests = 1;
  available: boolean | null = null;
  calendarReady = false;
  weather: any;
  mapUrl: SafeResourceUrl | null = null;
  money = money;
  get nights() {
    return this.from && this.to
      ? Math.max(0, Math.round((Date.parse(this.to) - Date.parse(this.from)) / 86400000))
      : 0;
  }
  get total() {
    return new Decimal(this.property?.precio_noche || 0).mul(this.nights).toFixed(2);
  }
  get deposit() {
    return new Decimal(this.total)
      .mul(this.property?.porcentaje_sena || 0)
      .div(100)
      .toFixed(2);
  }
  async ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    this.from = q.get('desde') || '';
    this.to = q.get('hasta') || '';
    this.guests = Number(q.get('huespedes') || 1);
    try {
      this.property = await this.api.request<Property>(
        `/properties/${this.route.snapshot.paramMap.get('id')}`,
      );
      if (this.auth.mapsKey) {
        const p = this.property;
        this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(this.auth.mapsKey)}&q=${encodeURIComponent(p.latitud + ',' + p.longitud)}`,
        );
      }
      if (this.from && this.to && this.nights > 0) await this.availability();
    } catch (e) {
      this.error = message(e);
    } finally {
      this.loading = false;
    }
  }
  resetAvailability() {
    this.available = null;
  }
  calendarState(ready: boolean, error: string) {
    this.calendarReady = ready;
    if (error) this.error = error;
  }
  async selectDates(from: string, to: string) {
    this.from = from;
    this.to = to;
    this.resetAvailability();
    this.error = '';
    this.weather = undefined;
    if (to) await this.availability();
  }
  async availability() {
    if (!this.from || !this.to || this.nights < 1) {
      this.error = 'Seleccioná fechas válidas para tu estadía.';
      return;
    }
    this.busy = true;
    this.error = '';
    const q = new URLSearchParams({ fecha_desde: this.from, fecha_hasta: this.to });
    try {
      const result = await this.api.request(`/properties/${this.property!.id}/availability?${q}`);
      this.available = result.disponible;
      this.weather = await this.api.request(`/properties/${this.property!.id}/weather?${q}`);
    } catch (e) {
      this.error = message(e);
    } finally {
      this.busy = false;
    }
  }
  async reserve() {
    if (!this.nights || this.available !== true || !this.calendarReady) {
      this.error = 'Elegí una estadía de al menos una noche.';
      return;
    }
    const data = {
      propiedad_id: this.property!.id,
      fecha_desde: this.from,
      fecha_hasta: this.to,
      cantidad_huespedes: this.guests,
    };
    if (!this.auth.user()) {
      localStorage.setItem('rentify-intent', JSON.stringify(data));
      await this.router.navigateByUrl('/auth/login');
      return;
    }
    this.busy = true;
    this.error = '';
    try {
      const r = await this.api.request('/reservations', 'POST', data);
      localStorage.removeItem('rentify-intent');
      await this.router.navigate(['/mis-reservas', r.id]);
    } catch (e) {
      const detail = message(e);
      if (/no está disponible|dejaron de estar disponibles/i.test(detail)) {
        this.error = 'Las fechas seleccionadas dejaron de estar disponibles. Elegí otro período.';
        this.resetAvailability();
        await this.calendar?.reload();
      } else this.error = detail;
    } finally {
      this.busy = false;
    }
  }
  fallback(e: Event) {
    (e.target as HTMLImageElement).src = '/house.svg';
  }
  condition(code: number) {
    return code === 0
      ? 'Despejado'
      : code <= 3
        ? 'Parcialmente nublado'
        : code <= 48
          ? 'Niebla'
          : code <= 67
            ? 'Lluvia'
            : code <= 77
              ? 'Nieve'
              : code <= 82
                ? 'Chaparrones'
                : 'Tormentas';
  }
}
