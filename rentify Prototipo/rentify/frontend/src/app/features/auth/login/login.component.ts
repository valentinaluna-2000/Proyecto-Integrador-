import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap container">
      <div class="card auth-card">
        <h2>Ingresar a Rentify</h2>
        <p class="text-muted">Accede con tu cuenta de cliente o de administrador.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" formControlName="email" placeholder="tu@email.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Contrasena</label>
            <input class="form-control" type="password" formControlName="password" placeholder="********" />
          </div>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <div class="auth-links">
          <a routerLink="/auth/olvide-password">Olvidaste tu contrasena?</a>
          <span class="text-muted">·</span>
          <a routerLink="/auth/registro">Crear cuenta de cliente</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; justify-content: center; padding: 60px 20px; }
    .auth-card { padding: 32px; max-width: 420px; width: 100%; }
    .auth-links { display: flex; gap: 8px; justify-content: center; margin-top: 18px; font-size: 0.88rem; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notify.success(`Bienvenido/a, ${res.user.nombre}`);
        this.router.navigate([res.user.role === 'ADMINISTRADOR' ? '/admin' : '/propiedades']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err?.error?.message || 'Credenciales invalidas.');
      },
    });
  }
}
