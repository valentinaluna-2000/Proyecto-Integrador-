import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property, money } from './core';
@Component({
  selector: 'app-status',
  standalone: true,
  template: `@if (loading()) {
      <div class="notice" role="status">
        <span class="spinner"></span> Un momento, estamos cargando…
      </div>
    }
    @if (error()) {
      <div class="notice error" role="alert">{{ error() }}</div>
    }
    @if (success()) {
      <div class="notice success" role="status">{{ success() }}</div>
    }`,
})
export class StatusComponent {
  loading = input(false);
  error = input('');
  success = input('');
}
@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [RouterLink],
  template: `<a class="property-card" [routerLink]="['/propiedades', property().id]"
    ><div class="property-image">
      <img
        [src]="property().imagenes[0]?.url || '/house.svg'"
        [alt]="property().nombre"
        loading="lazy"
        (error)="fallback($event)"
      /><span class="pill">{{ property().tipo }}</span>
    </div>
    <div class="property-content">
      <div class="muted small">{{ property().direccion }}</div>
      <h3>{{ property().nombre }}</h3>
      <p class="small muted">
        {{ property().capacidad }} {{ property().capacidad === 1 ? 'huésped' : 'huéspedes' }} ·
        {{ property().cantidad_habitaciones }}
        {{ property().cantidad_habitaciones === 1 ? 'habitación' : 'habitaciones' }} ·
        {{ property().cantidad_banos }} {{ property().cantidad_banos === 1 ? 'baño' : 'baños' }}
      </p>
      <div class="card-bottom">
        <strong>{{ money(property().precio_noche) }} <small>/ noche</small></strong
        ><span class="circle-arrow">↗</span>
      </div>
    </div></a
  >`,
})
export class PropertyCardComponent {
  property = input.required<Property>();
  money = money;
  fallback(e: Event) {
    (e.target as HTMLImageElement).src = '/house.svg';
  }
}
