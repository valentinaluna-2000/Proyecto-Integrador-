import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap container">
      <div class="card auth-card">
        <h2>Crear cuenta de cliente</h2>
        <p class="text-muted">Registrate para poder reservar propiedades.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" formControlName="nombre" />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido</label>
              <input class="form-control" formControlName="apellido" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" formControlName="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Telefono (opcional)</label>
            <input class="form-control" formControlName="telefono" />
          </div>
          <div class="form-group">
            <label class="form-label">Contrasena</label>
            <input class="form-control" type="password" formControlName="password" />
            <span class="text-muted" style="font-size:0.8rem">Minimo 8 caracteres, con letras y numeros.</span>
          </div>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="auth-links">
          <span class="text-muted">Ya tenes cuenta?</span>
          <a routerLink="/auth/login">Ingresar</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; justify-content: center; padding: 60px 20px; }
    .auth-card { padding: 32px; max-width: 460px; width: 100%; }
    .auth-links { display: flex; gap: 8px; justify-content: center; margin-top: 18px; font-size: 0.88rem; }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notify.success(`Cuenta creada. Bienvenido/a, ${res.user.nombre}`);
        this.router.navigate(['/propiedades']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err?.error?.message || 'No se pudo crear la cuenta.');
      },
    });
  }
}
