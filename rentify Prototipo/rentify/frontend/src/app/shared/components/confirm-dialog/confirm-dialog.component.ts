import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div class="overlay" (click)="cancel.emit()">
        <div class="dialog card" (click)="$event.stopPropagation()">
          <h3>{{ title }}</h3>
          <p class="text-muted">{{ message }}</p>
          <div class="dialog-actions">
            <button class="btn btn-outline" (click)="cancel.emit()">Cancelar</button>
            <button class="btn btn-danger" (click)="confirm.emit()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 1500; padding: 20px;
    }
    .dialog { padding: 24px; max-width: 420px; width: 100%; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
  `],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirmar accion';
  @Input() message = 'Esta seguro que desea continuar?';
  @Input() confirmLabel = 'Confirmar';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
