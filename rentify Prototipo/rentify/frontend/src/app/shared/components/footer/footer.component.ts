import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="container footer-inner">
        <span>© {{ year }} Rentify — Proyecto academico UTN Villa Maria.</span>
        <span class="text-muted">Gestion de reservas temporarias de propiedades.</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      border-top: 1px solid var(--color-border);
      background: #fff;
      margin-top: 60px;
    }
    .footer-inner {
      padding: 24px 20px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
  `],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
