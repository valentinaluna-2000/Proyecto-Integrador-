import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading-wrap">
      <div class="spinner"></div>
      @if (label) { <span>{{ label }}</span> }
    </div>
  `,
  styles: [`
    .loading-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px 0;
      color: var(--color-text-muted);
    }
    .spinner {
      width: 26px;
      height: 26px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoadingComponent {
  @Input() label = 'Cargando...';
}
