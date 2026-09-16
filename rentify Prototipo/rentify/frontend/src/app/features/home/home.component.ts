import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertiesService } from '../../core/services/properties.service';
import { Property } from '../../core/models/property.model';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-text">
          <h1>Encontra tu proxima estadia con Rentify</h1>
          <p class="text-muted">
            Casas, cabanas, departamentos y quintas para alquiler temporario.
            Reserva online, pagas la sena y listo.
          </p>
          <a routerLink="/propiedades" class="btn btn-primary">Ver propiedades disponibles</a>
        </div>
        <div class="hero-illustration">🏡🌴</div>
      </div>
    </section>

    <section class="section container">
      <div class="section-header">
        <h2>Propiedades destacadas</h2>
        <a routerLink="/propiedades">Ver todas →</a>
      </div>

      @if (loading()) {
        <app-loading label="Buscando propiedades..." />
      } @else if (properties().length === 0) {
        <div class="empty-state">Todavia no hay propiedades publicadas.</div>
      } @else {
        <div class="grid grid-4">
          @for (p of properties(); track p.id) {
            <a class="card property-card" [routerLink]="['/propiedades', p.id]">
              <div class="property-image" [style.background-image]="'url(' + (p.imagenes[0]?.url || placeholder) + ')'"></div>
              <div class="property-body">
                <h4>{{ p.nombre }}</h4>
                <p class="text-muted">{{ p.ciudad }}</p>
                <p class="price">$ {{ p.precioNoche | number }} / noche</p>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, var(--color-primary) 0%, #6c5ce7 100%);
      color: #fff;
      padding: 70px 0;
    }
    .hero-inner { display: flex; align-items: center; justify-content: space-between; gap: 30px; }
    .hero-text h1 { font-size: 2.3rem; max-width: 560px; }
    .hero-text p { color: rgba(255,255,255,0.85); max-width: 480px; margin-bottom: 20px; }
    .hero-illustration { font-size: 5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; }
    .property-card { display: block; overflow: hidden; transition: transform 0.15s ease; }
    .property-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .property-image { height: 150px; background-size: cover; background-position: center; background-color: #dfe6f0; }
    .property-body { padding: 14px; }
    .property-body h4 { margin-bottom: 4px; font-size: 1rem; }
    .price { font-weight: 700; color: var(--color-primary); margin: 6px 0 0; }
    @media (max-width: 720px) { .hero-inner { flex-direction: column; text-align: center; } }
  `],
})
export class HomeComponent implements OnInit {
  private propertiesService = inject(PropertiesService);

  properties = signal<Property[]>([]);
  loading = signal(true);
  placeholder = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600';

  ngOnInit(): void {
    this.propertiesService.findAll({ page: 1, limit: 4 }).subscribe({
      next: (res) => {
        this.properties.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
