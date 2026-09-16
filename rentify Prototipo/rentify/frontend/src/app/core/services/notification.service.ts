import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);

  show(message: string, type: NotificationType = 'info', durationMs = 4500) {
    const id = nextId++;
    this.notifications.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string) {
    this.show(message, 'success');
  }
  error(message: string) {
    this.show(message, 'error', 6000);
  }
  warning(message: string) {
    this.show(message, 'warning');
  }

  dismiss(id: number) {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }
}
