import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingComponent],
  template: `
    <div class="container section profile-wrap">
      <h1>Mi perfil</h1>

      @if (loading()) {
        <app-loading />
      } @else {
        <div class="card profile-card">
          <p class="text-muted">
            Rol: <strong>{{ auth.currentUser()?.role === 'ADMINISTRADOR' ? 'Administrador' : 'Cliente' }}</strong>
            · Email: <strong>{{ profile()?.email }}</strong>
          </p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            @if (auth.isCliente()) {
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
                <label class="form-label">Telefono</label>
                <input class="form-control" formControlName="telefono" />
              </div>
            } @else {
              <div class="form-group">
                <label class="form-label">Nombre de usuario</label>
                <input class="form-control" formControlName="nombre" />
              </div>
            }

            <div class="form-group">
              <label class="form-label">Nueva contrasena (opcional)</label>
              <input class="form-control" type="password" formControlName="password" placeholder="Dejar en blanco para no cambiar" />
            </div>

            <button class="btn btn-primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-wrap { max-width: 640px; }
    .profile-card { padding: 26px; }
  `],
})
export class ProfileComponent implements OnInit {
  private usersService = inject(UsersService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  profile = signal<any>(null);

  form = this.fb.group({
    nombre: [''],
    apellido: [''],
    telefono: [''],
    password: [''],
  });

  ngOnInit(): void {
    this.usersService.getMe().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.form.patchValue({
          nombre: data.nombre || data.usuario || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submit() {
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: any = { nombre: raw.nombre || undefined, apellido: raw.apellido || undefined, telefono: raw.telefono || undefined };
    if (raw.password) payload.password = raw.password;
    this.usersService.updateMe(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Datos actualizados correctamente.');
        this.form.patchValue({ password: '' });
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(err?.error?.message || 'No se pudieron guardar los cambios.');
      },
    });
  }
}
