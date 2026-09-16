import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap container">
      <div class="card auth-card">
        <h2>Nueva contrasena</h2>
        @if (!token()) {
          <div class="empty-state">
            El enlace no es valido. Solicita uno nuevo desde
            <a routerLink="/auth/olvide-password">recuperar contrasena</a>.
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-group">
              <label class="form-label">Nueva contrasena</label>
              <input class="form-control" type="password" formControlName="newPassword" />
              <span class="text-muted" style="font-size:0.8rem">Minimo 8 caracteres, con letras y numeros.</span>
            </div>
            <button class="btn btn-primary btn-block" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Guardando...' : 'Restablecer contrasena' }}
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
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading = signal(false);
  token = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    newPassword: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)],
    ],
  });

  ngOnInit() {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
  }

  submit() {
    if (this.form.invalid || !this.token()) return;
    this.loading.set(true);
    this.auth.resetPassword(this.token()!, this.form.getRawValue().newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.notify.success('Contrasena actualizada. Ya podes ingresar.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err?.error?.message || 'El enlace es invalido o expiro.');
      },
    });
  }
}
