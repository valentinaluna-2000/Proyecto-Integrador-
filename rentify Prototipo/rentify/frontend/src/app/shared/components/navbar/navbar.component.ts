import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="container navbar-inner">
        <a routerLink="/" class="brand">
          <span class="brand-icon">🏡</span> Rentify
        </a>

        <nav class="links">
          <a routerLink="/propiedades" routerLinkActive="active">Propiedades</a>

          @if (auth.isCliente()) {
            <a routerLink="/mis-reservas" routerLinkActive="active">Mis reservas</a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active">Panel administrador</a>
          }
        </nav>

        <div class="actions">
          @if (auth.isAuthenticated()) {
            <a routerLink="/perfil" class="user-chip">
              👤 {{ auth.currentUser()?.nombre }}
            </a>
            <button class="btn btn-outline btn-sm" (click)="logout()">Salir</button>
          } @else {
            <a routerLink="/auth/login" class="btn btn-outline btn-sm">Ingresar</a>
            <a routerLink="/auth/registro" class="btn btn-primary btn-sm">Crear cuenta</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background: #fff;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 66px;
      gap: 20px;
    }
    .brand {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .links {
      display: flex;
      gap: 22px;
      flex: 1;
    }
    .links a {
      color: var(--color-text-muted);
      font-weight: 500;
      font-size: 0.95rem;
      padding: 6px 0;
      border-bottom: 2px solid transparent;
    }
    .links a.active, .links a:hover { color: var(--color-primary); border-color: var(--color-primary); }
    .actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .user-chip {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-text);
      background: var(--color-bg);
      padding: 6px 12px;
      border-radius: 999px;
    }
    @media (max-width: 720px) {
      .links { display: none; }
    }
  `],
})
export class NavbarComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
