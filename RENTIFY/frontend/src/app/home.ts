import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, Page, Property, message } from './core';
import { PropertyCardComponent, StatusComponent } from './shared';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, PropertyCardComponent, StatusComponent],
  template: `<section class="home-hero guest-home-hero">
    <div class="guest-home-copy">
      <span class="eyebrow">ALQUILERES TEMPORARIOS EN ARGENTINA</span>
      <h1>Un lugar para bajar el ritmo y sentirte en casa.</h1>
      <p>Propiedades pensadas para descansar, trabajar o descubrir un lugar nuevo con tranquilidad.</p>
      <a routerLink="/propiedades" class="button">Explorar propiedades <span>↗</span></a>
    </div>
    <div class="guest-home-carousel" (mouseenter)="pauseCarousel()" (mouseleave)="resumeCarousel()" (focusin)="pauseCarousel()" (focusout)="resumeCarousel()">
      @if (activeProperty; as cover) {
        <a class="guest-home-visual" [class.is-transitioning]="transitioning" [routerLink]="['/propiedades', cover.id]" [attr.aria-label]="'Ver alojamiento ' + cover.nombre">
          @if (cover.imagenes[0]?.url) {
            <img [src]="cover.imagenes[0].url" [alt]="cover.nombre" (error)="hideUnavailableImage($event)" />
          }
          <span class="guest-home-caption"><small>ALOJAMIENTO {{ activeIndex + 1 }} DE {{ properties.length }}</small><strong>{{ cover.nombre }}</strong><span>{{ cover.direccion }}</span></span>
        </a>
        @if (properties.length > 1) {
          <nav class="guest-home-carousel-controls" aria-label="Navegación de alojamientos destacados">
            <span>{{ activeIndex + 1 }} / {{ properties.length }}</span>
            <button type="button" aria-label="Alojamiento anterior" [disabled]="transitioning" (click)="showProperty(-1)">←</button>
            <button type="button" aria-label="Siguiente alojamiento" [disabled]="transitioning" (click)="showProperty(1)">→</button>
          </nav>
        }
      } @else {
        <div class="guest-home-visual guest-home-empty" role="status">
          @if (loading) {
            <small>RENTIFY · ARGENTINA</small><strong>Buscando alojamientos disponibles…</strong>
          } @else if (error) {
            <small>RENTIFY · ARGENTINA</small><strong>No pudimos cargar los alojamientos.</strong>
          } @else {
            <small>RENTIFY · ARGENTINA</small><strong>Pronto habrá nuevos lugares para descubrir.</strong><span>Mientras tanto, podés explorar el catálogo.</span>
          }
        </div>
      }
    </div>
  </section>

  <section class="home-section quick-search guest-quick-search">
    <div><span class="eyebrow">PLANIFICÁ TU VIAJE</span><h2>¿A dónde vamos?</h2></div>
    <form class="search-panel" (ngSubmit)="search()">
      <label class="wide">Destino<input name="ubicacion" [(ngModel)]="filters.ubicacion" placeholder="Ciudad, zona o alojamiento" /></label>
      <label>Ingreso<input name="fecha_desde" type="date" [(ngModel)]="filters.fecha_desde" /></label>
      <label>Egreso<input name="fecha_hasta" type="date" [(ngModel)]="filters.fecha_hasta" /></label>
      <label>Huéspedes<input name="capacidad" type="number" min="1" [(ngModel)]="filters.capacidad" /></label>
      <button>Buscar <span>↗</span></button>
    </form>
  </section>

  <section class="home-section guest-featured">
    <div class="section-heading"><div><span class="eyebrow">DESTACADOS</span><h2>Lugares para quedarte un poco más</h2></div><a routerLink="/propiedades" class="text-link">Ver todas las propiedades</a></div>
    <app-status [loading]="loading" [error]="error" />
    <div class="property-grid">@for (property of featured; track property.id) { <app-property-card [property]="property" /> }</div>
    @if (!loading && !error && !featured.length) {
      <p class="empty guest-featured-empty">Todavía no hay alojamientos publicados. Volvé pronto para descubrir nuevos lugares.</p>
    }
  </section>

  <section class="home-section home-how guest-how">
    <span class="eyebrow">CÓMO FUNCIONA</span><h2>Reservá en cuatro pasos simples.</h2>
    <div class="steps">
      <article class="step-card"><div class="step-card-top"><span class="step-number"><span>01</span></span><span class="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.4 15.4 4.2 4.2"/></svg></span></div><h3>Buscá</h3><p>Elegí destino, fechas y cantidad de huéspedes.</p></article>
      <article class="step-card"><div class="step-card-top"><span class="step-number"><span>02</span></span><span class="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg></span></div><h3>Elegí fechas</h3><p>Consultá el calendario actualizado de cada propiedad.</p></article>
      <article class="step-card"><div class="step-card-top"><span class="step-number"><span>03</span></span><span class="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5v-1h6v1M8.5 12l2.2 2.2 4.8-4.8"/></svg></span></div><h3>Reservá</h3><p>Confirmá los detalles de tu estadía.</p></article>
      <article class="step-card"><div class="step-card-top"><span class="step-number"><span>04</span></span><span class="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg></span></div><h3>Pagá la seña</h3><p>Completá el pago y prepará el viaje.</p></article>
    </div>
  </section>

  <section class="home-section home-benefits guest-benefits">
    <span class="eyebrow">RENTIFY</span><h2>Todo lo que necesitás para reservar con confianza.</h2>
    <div class="benefits"><p><b>Disponibilidad actualizada</b>Fechas claras antes de reservar.</p><p><b>Reservas seguras</b>Tu operación queda registrada y protegida.</p><p><b>Propiedades verificadas</b>Información completa de cada alojamiento.</p><p><b>Detalles transparentes</b>Precio, seña y políticas a la vista.</p></div>
    <a routerLink="/propiedades" class="button">Explorar propiedades <span>↗</span></a>
  </section>`,
})
export class HomeComponent implements OnInit, OnDestroy {
  api = inject(Api);
  router = inject(Router);
  properties: Property[] = [];
  featured: Property[] = [];
  activeIndex = 0;
  transitioning = false;
  loading = false;
  error = '';
  private carouselTimer?: ReturnType<typeof setInterval>;
  private transitionTimer?: ReturnType<typeof setTimeout>;
  private settleTimer?: ReturnType<typeof setTimeout>;
  filters: Record<string, string | number> = { ubicacion: '', fecha_desde: '', fecha_hasta: '', capacidad: '' };
  get activeProperty() {
    return this.properties[this.activeIndex];
  }
  async ngOnInit() {
    this.loading = true;
    try {
      const limit = 100;
      let page = 1;
      let total = 0;
      do {
        const result = await this.api.request<Page<Property>>('/properties?page=' + page + '&limit=' + limit);
        this.properties = [...this.properties, ...result.items];
        total = result.total;
        page += 1;
        if (!result.items.length) break;
      } while (this.properties.length < total);
    }
    catch (error) { this.error = message(error); }
    finally {
      this.featured = this.properties.slice(0, 4);
      this.loading = false;
      this.resumeCarousel();
    }
  }
  ngOnDestroy() {
    this.pauseCarousel();
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
    if (this.settleTimer) clearTimeout(this.settleTimer);
  }
  pauseCarousel() {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    this.carouselTimer = undefined;
  }
  resumeCarousel() {
    if (this.carouselTimer || this.properties.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.carouselTimer = setInterval(() => this.showProperty(1), 6500);
  }
  showProperty(direction: number) {
    if (this.properties.length < 2 || this.transitioning) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.transitioning = !reducedMotion;
    const change = () => {
      this.activeIndex = (this.activeIndex + direction + this.properties.length) % this.properties.length;
      this.settleTimer = setTimeout(() => (this.transitioning = false), reducedMotion ? 0 : 180);
    };
    this.transitionTimer = setTimeout(change, reducedMotion ? 0 : 140);
  }
  async search() {
    const queryParams = Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value !== ''));
    await this.router.navigate(['/propiedades'], { queryParams });
  }
  hideUnavailableImage(event: Event) {
    (event.target as HTMLImageElement).hidden = true;
  }
}
