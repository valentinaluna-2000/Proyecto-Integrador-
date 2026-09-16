import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="container admin-wrap">
      <aside class="admin-sidebar card">
        <h3>Panel administrador</h3>
        <nav>
          <a routerLink="/admin/propiedades" routerLinkActive="active">🏠 Propiedades</a>
          <a routerLink="/admin/reservas" routerLinkActive="active">📅 Reservas</a>
          <a routerLink="/admin/pagos" routerLinkActive="active">💳 Pagos</a>
          <a routerLink="/admin/reportes" routerLinkActive="active">📊 Reportes</a>
        </nav>
      </aside>
      <section class="admin-content">
        <router-outlet />
      </section>
    </div>
  `,
  styles: [`
    .admin-wrap {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 24px;
      padding: 30px 20px 60px;
      align-items: start;
    }
    .admin-sidebar { padding: 20px; position: sticky; top: 90px; }
    .admin-sidebar nav { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
    .admin-sidebar a { padding: 8px 10px; border-radius: 8px; color: var(--color-text-muted); font-weight: 500; }
    .admin-sidebar a.active, .admin-sidebar a:hover { background: var(--color-bg); color: var(--color-primary); }
    @media (max-width: 800px) {
      .admin-wrap { grid-template-columns: 1fr; }
      .admin-sidebar { position: static; }
      .admin-sidebar nav { flex-direction: row; flex-wrap: wrap; }
    }
  `],
})
export class AdminLayoutComponent {}
