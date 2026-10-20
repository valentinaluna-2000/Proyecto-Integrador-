import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, Page, Property, message } from './core';
import { PropertyCardComponent, StatusComponent } from './shared';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, PropertyCardComponent, StatusComponent],
  template: `<section class="home-hero">
    <div>
      <img class="home-logo" src="/branding/rentify-logo.png" alt="Rentify" />
      <span class="eyebrow">ALQUILERES TEMPORARIOS EN ARGENTINA</span>
      <h1>Encontrá tu próxima estadía.</h1>
      <p>Propiedades pensadas para descansar, trabajar o descubrir un lugar nuevo con tranquilidad.</p>
      <a routerLink="/propiedades" class="button">Explorar propiedades <span>↗</span></a>
    </div>
    <img src="/house.svg" alt="Una casa entre las sierras" />
  </section>

  <section class="home-section quick-search">
    <div><span class="eyebrow">PLANIFICÁ TU VIAJE</span><h2>¿A dónde vamos?</h2></div>
    <form class="search-panel" (ngSubmit)="search()">
      <label class="wide">Destino<input name="ubicacion" [(ngModel)]="filters.ubicacion" placeholder="Ciudad, zona o alojamiento" /></label>
      <label>Ingreso<input name="fecha_desde" type="date" [(ngModel)]="filters.fecha_desde" /></label>
      <label>Egreso<input name="fecha_hasta" type="date" [(ngModel)]="filters.fecha_hasta" /></label>
      <label>Huéspedes<input name="capacidad" type="number" min="1" [(ngModel)]="filters.capacidad" /></label>
      <button>Buscar <span>↗</span></button>
    </form>
  </section>

  <section class="home-section">
    <div class="section-heading"><div><span class="eyebrow">DESTACADOS</span><h2>Lugares para quedarte un poco más</h2></div><a routerLink="/propiedades" class="text-link">Ver todas las propiedades</a></div>
    <app-status [loading]="loading" [error]="error" />
    <div class="property-grid">@for (property of featured; track property.id) { <app-property-card [property]="property" /> }</div>
  </section>

  <section class="home-section home-how">
    <span class="eyebrow">CÓMO FUNCIONA</span><h2>Reservá en cuatro pasos simples.</h2>
    <div class="steps">
      <article><b>01</b><h3>Buscá</h3><p>Elegí destino, fechas y cantidad de huéspedes.</p></article>
      <article><b>02</b><h3>Elegí fechas</h3><p>Consultá el calendario actualizado de cada propiedad.</p></article>
      <article><b>03</b><h3>Reservá</h3><p>Confirmá los detalles de tu estadía.</p></article>
      <article><b>04</b><h3>Pagá la seña</h3><p>Completá el pago y prepará el viaje.</p></article>
    </div>
  </section>

  <section class="home-section home-benefits">
    <span class="eyebrow">RENTIFY</span><h2>Todo lo que necesitás para reservar con confianza.</h2>
    <div class="benefits"><p><b>Disponibilidad actualizada</b>Fechas claras antes de reservar.</p><p><b>Reservas seguras</b>Tu operación queda registrada y protegida.</p><p><b>Propiedades verificadas</b>Información completa de cada alojamiento.</p><p><b>Detalles transparentes</b>Precio, seña y políticas a la vista.</p></div>
    <a routerLink="/propiedades" class="button">Explorar propiedades <span>↗</span></a>
  </section>`,
})
export class HomeComponent implements OnInit {
  api = inject(Api);
  router = inject(Router);
  featured: Property[] = [];
  loading = false;
  error = '';
  filters: Record<string, string | number> = { ubicacion: '', fecha_desde: '', fecha_hasta: '', capacidad: '' };
  async ngOnInit() {
    this.loading = true;
    try { this.featured = (await this.api.request<Page<Property>>('/properties?limit=4')).items; }
    catch (error) { this.error = message(error); }
    finally { this.loading = false; }
  }
  async search() {
    const queryParams = Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value !== ''));
    await this.router.navigate(['/propiedades'], { queryParams });
  }
}
