import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertiesService } from '../../../core/services/properties.service';
import { ReservationsService } from '../../../core/services/reservations.service';
import { IntegrationsService } from '../../../core/services/integrations.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Availability, Property } from '../../../core/models/property.model';
import { ReservationSimulation } from '../../../core/models/reservation.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingComponent],
  template: `
    @if (loading()) {
      <app-loading label="Cargando propiedad..." />
    } @else if (!property()) {
      <div class="empty-state">La propiedad no existe o no esta disponible.</div>
    } @else {
      <div class="container section detail">
        <a routerLink="/propiedades" class="back-link">← Volver a propiedades</a>

        <div class="gallery">
          <div class="gallery-main" [style.background-image]="'url(' + activeImage() + ')'"></div>
          @if (property()!.imagenes.length > 1) {
            <div class="gallery-thumbs">
              @for (img of property()!.imagenes; track img.id) {
                <div
                  class="thumb"
                  [class.active]="img.url === activeImage()"
                  [style.background-image]="'url(' + img.url + ')'"
                  (click)="activeImage.set(img.url)"
                ></div>
              }
            </div>
          }
        </div>

        <div class="detail-grid">
          <div class="detail-main">
            <h1>{{ property()!.nombre }}</h1>
            <p class="text-muted">{{ property()!.direccion }}, {{ property()!.ciudad }}</p>

            <div class="chips">
              <span class="chip">🏠 {{ typeLabel(property()!.tipo) }}</span>
              <span class="chip">👥 Hasta {{ property()!.capacidad }} huespedes</span>
              <span class="chip">🕒 Check-in {{ property()!.horaCheckin }} · Check-out {{ property()!.horaCheckout }}</span>
              @if (property()!.aceptaMascotas) { <span class="chip">🐾 Acepta mascotas</span> }
              @if (property()!.aceptaMenores) { <span class="chip">🧒 Acepta menores</span> }
            </div>

            <h3>Descripcion</h3>
            <p>{{ property()!.descripcion }}</p>

            <h3>Ubicacion</h3>
            @if (mapsEnabled()) {
              <iframe
                class="map-frame"
                [src]="mapSrc()"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            } @else {
              <div class="map-fallback card">
                Mapa no disponible en este momento.
                <a
                  [href]="'https://www.google.com/maps/search/?api=1&query=' + property()!.latitud + ',' + property()!.longitud"
                  target="_blank"
                >
                  Ver en Google Maps
                </a>
              </div>
            }

            <h3>Pronostico durante la estadia</h3>
            @if (weather() === null) {
              <p class="text-muted">Selecciona una fecha de entrada para ver el pronostico.</p>
            } @else if (weather()!.disponible === false) {
              <p class="text-muted">{{ weather()!.mensaje }}</p>
            } @else {
              <div class="weather-card card">
                <span>📅 {{ weather()!.fecha }}</span>
                <span>🌡️ {{ weather()!.temperaturaMin }}° / {{ weather()!.temperaturaMax }}°</span>
                <span>🌧️ {{ weather()!.probabilidadPrecipitacion }}% prob. lluvia</span>
              </div>
            }
          </div>

          <div class="booking-card card">
            <h3>$ {{ property()!.precioNoche | number }} <span class="text-muted">/ noche</span></h3>
            <p class="text-muted">Sena: {{ property()!.porcentajeSena }}% del total</p>

            <div class="form-group">
              <label class="form-label">Entrada</label>
              <input
                class="form-control"
                type="date"
                [(ngModel)]="fechaDesde"
                [min]="minDate"
                (change)="onDatesChange()"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Salida</label>
              <input
                class="form-control"
                type="date"
                [(ngModel)]="fechaHasta"
                [min]="fechaDesde || minDate"
                (change)="onDatesChange()"
              />
            </div>

            @if (simulationError()) {
              <p class="form-error">{{ simulationError() }}</p>
            }

            @if (simulation()) {
              <div class="summary">
                <div><span>{{ simulation()!.noches }} noches</span><span>$ {{ simulation()!.importeTotal | number }}</span></div>
                <div class="summary-sena"><span>Sena a pagar ahora</span><span>$ {{ simulation()!.importeSena | number }}</span></div>
              </div>
            }

            @if (auth.isAuthenticated() && auth.isCliente()) {
              <button
                class="btn btn-primary btn-block"
                [disabled]="!simulation() || creating()"
                (click)="reservar()"
              >
                {{ creating() ? 'Creando reserva...' : 'Reservar ahora' }}
              </button>
            } @else if (auth.isAuthenticated() && auth.isAdmin()) {
              <p class="text-muted" style="text-align:center">Ingresa con una cuenta de cliente para reservar.</p>
            } @else {
              <a routerLink="/auth/login" class="btn btn-primary btn-block">Inicia sesion para reservar</a>
            }

            <p class="hold-note text-muted">
              Al iniciar la reserva, las fechas quedan retenidas por 90 minutos para completar el pago de la sena.
            </p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .back-link { display: inline-block; margin-bottom: 16px; color: var(--color-text-muted); }
    .gallery-main {
      height: 340px; border-radius: var(--radius-md);
      background-size: cover; background-position: center; background-color: #dfe6f0;
    }
    .gallery-thumbs { display: flex; gap: 10px; margin-top: 10px; }
    .thumb {
      width: 80px; height: 60px; border-radius: 8px; background-size: cover;
      background-position: center; cursor: pointer; opacity: 0.6; background-color: #dfe6f0;
    }
    .thumb.active, .thumb:hover { opacity: 1; outline: 2px solid var(--color-primary); }
    .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; margin-top: 26px; align-items: start; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0; }
    .chip { background: var(--color-bg); padding: 6px 12px; border-radius: 999px; font-size: 0.85rem; }
    .map-frame { width: 100%; height: 260px; border: 0; border-radius: var(--radius-md); }
    .map-fallback { padding: 20px; text-align: center; }
    .weather-card { padding: 14px 18px; display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.92rem; }
    .booking-card { padding: 22px; position: sticky; top: 90px; }
    .summary { margin: 14px 0; border-top: 1px solid var(--color-border); padding-top: 12px; font-size: 0.92rem; }
    .summary > div { display: flex; justify-content: space-between; padding: 3px 0; }
    .summary-sena { font-weight: 700; color: var(--color-primary); }
    .hold-note { font-size: 0.78rem; margin-top: 12px; text-align: center; }
    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
      .booking-card { position: static; }
    }
  `],
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertiesService = inject(PropertiesService);
  private reservationsService = inject(ReservationsService);
  private integrationsService = inject(IntegrationsService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  property = signal<Property | null>(null);
  availability = signal<Availability | null>(null);
  loading = signal(true);
  activeImage = signal('https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200');

  mapsEnabled = signal(false);
  mapsApiKey = signal<string | null>(null);
  weather = signal<any>(null);

  fechaDesde = '';
  fechaHasta = '';
  minDate = new Date().toISOString().slice(0, 10);

  simulation = signal<ReservationSimulation | null>(null);
  simulationError = signal<string | null>(null);
  creating = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.propertiesService.findOne(id).subscribe({
      next: (property) => {
        this.property.set(property);
        if (property.imagenes[0]) this.activeImage.set(property.imagenes[0].url);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.propertiesService.getAvailability(id).subscribe({
      next: (av) => this.availability.set(av),
    });
    this.integrationsService.getMapsConfig().subscribe({
      next: (cfg) => {
        this.mapsEnabled.set(cfg.enabled);
        this.mapsApiKey.set(cfg.apiKey);
      },
    });
  }

  typeLabel(tipo: string): string {
    const labels: Record<string, string> = {
      casa: 'Casa',
      cabana: 'Cabana',
      departamento: 'Departamento',
      quinta: 'Quinta',
    };
    return labels[tipo] || tipo;
  }

  mapSrc() {
    const p = this.property();
    if (!p) return '';
    const key = this.mapsApiKey();
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${p.latitud},${p.longitud}`;
  }

  onDatesChange() {
    this.simulation.set(null);
    this.simulationError.set(null);
    this.weather.set(null);

    if (!this.fechaDesde) return;

    const p = this.property();
    if (p) {
      this.integrationsService.getWeather(p.latitud, p.longitud, this.fechaDesde).subscribe({
        next: (w) => this.weather.set(w),
        error: () => this.weather.set({ disponible: false, mensaje: 'No se pudo obtener el pronostico.' }),
      });
    }

    if (!this.fechaHasta) return;
    if (!p) return;

    this.reservationsService.simulate(p.id, this.fechaDesde, this.fechaHasta).subscribe({
      next: (sim) => this.simulation.set(sim),
      error: (err) => this.simulationError.set(err?.error?.message || 'No se pudo calcular la reserva.'),
    });
  }

  reservar() {
    const p = this.property();
    if (!p || !this.simulation()) return;
    this.creating.set(true);
    this.reservationsService.create(p.id, this.fechaDesde, this.fechaHasta).subscribe({
      next: (reservation) => {
        this.creating.set(false);
        this.notify.success('Reserva creada. Tenes 90 minutos para pagar la sena.');
        this.router.navigate(['/mis-reservas'], { queryParams: { highlight: reservation.id } });
      },
      error: (err) => {
        this.creating.set(false);
        this.notify.error(err?.error?.message || 'No se pudo crear la reserva.');
      },
    });
  }
}
