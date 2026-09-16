import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (n of notify.notifications(); track n.id) {
        <div class="toast" [class]="'toast-' + n.type" (click)="notify.dismiss(n.id)">
          {{ n.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 340px;
    }
    .toast {
      padding: 12px 16px;
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 6px 18px rgba(0,0,0,0.18);
      cursor: pointer;
      animation: slide-in 0.2s ease;
    }
    .toast-success { background: #22b573; }
    .toast-error { background: #e5484d; }
    .toast-warning { background: #d97706; }
    .toast-info { background: #2f6fed; }
    @keyframes slide-in {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
})
export class ToastComponent {
  notify = inject(NotificationService);
}
