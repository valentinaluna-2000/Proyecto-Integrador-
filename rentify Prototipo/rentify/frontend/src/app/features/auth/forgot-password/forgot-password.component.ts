import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap container">
      <div class="card auth-card">
        <h2>Recuperar contrasena</h2>
        <p class="text-muted">Te enviaremos un enlace para restablecerla.</p>

        @if (sent()) {
          <div class="empty-state">
            Si el email existe en nuestro sistema, vas a recibir un correo con instrucciones.
            <br /><a routerLink="/auth/login">Volver a ingresar</a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-control" type="email" formControlName="email" />
            </div>
            <button class="btn btn-primary btn-block" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Enviando...' : 'Enviar enlace' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; justify-content: center; padding: 60px 20px; }
    .auth-card { padding: 32px; max-width: 420px; width: 100%; }
  `],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  loading = signal(false);
  sent = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err?.error?.message || 'Ocurrio un error.');
      },
    });
  }
}
