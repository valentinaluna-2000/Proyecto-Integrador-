import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from './core';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `<header>
      <a routerLink="/" class="brand" aria-label="Rentify inicio"><img src="/branding/rentify-logo.png" alt="Rentify" /></a>
      <nav aria-label="Navegación principal">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
          >Inicio</a
        ><a routerLink="/propiedades" routerLinkActive="active">Propiedades</a>
      </nav>
      <div class="account-nav">
        @if (auth.user(); as user) {
          <a [routerLink]="user.role === 'ADMINISTRADOR' ? '/admin' : '/mis-reservas'">{{
            user.role === 'ADMINISTRADOR' ? 'Administración' : 'Mis reservas'
          }}</a
          ><a routerLink="/cuenta" class="avatar" [attr.aria-label]="'Perfil de ' + user.nombre">{{
            user.nombre.charAt(0)
          }}</a
          ><button class="text-button" (click)="auth.logout()">Salir</button>
        } @else {
          <a routerLink="/auth/login">Iniciar sesión</a
          ><a routerLink="/auth/registro" class="button small-button">Registrate ↗</a>
        }
      </div>
    </header>
    @if (auth.user()?.role === 'ADMINISTRADOR') {
      <nav class="admin-nav" aria-label="Administración">
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
          >Dashboard</a
        ><a routerLink="/admin/propiedades" routerLinkActive="active">Propiedades</a
        ><a routerLink="/admin/reservas" routerLinkActive="active">Reservas</a
        ><a routerLink="/admin/pagos" routerLinkActive="active">Pagos</a
        ><a routerLink="/admin/cancelaciones" routerLinkActive="active">Cancelaciones</a
        ><a routerLink="/admin/reportes" routerLinkActive="active">Reportes</a>
      </nav>
    }
    <main><router-outlet /></main>
    <footer>
      <div>
        <a routerLink="/" class="brand inverse"><img src="/branding/rentify-logo.png" alt="Rentify" /></a>
        <p>Tu lugar, por un tiempo.<br />Tus recuerdos, para siempre.</p>
      </div>
      <div>
        <strong>Un viaje más simple.</strong><a routerLink="/propiedades">Encontrá un alojamiento</a
        ><a routerLink="/cuenta">Mi cuenta</a>
      </div>
      <div class="footer-bottom">
        <span>© {{ year }} Rentify · Alquileres temporarios</span
        ><span>Hecho para disfrutar Argentina. ↗</span>
      </div>
    </footer>`,
})
export class AppComponent {
  auth = inject(Auth);
  year = new Date().getFullYear();
}
