import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, Auth, message } from './core';
import { StatusComponent } from './shared';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, StatusComponent],
  template: `<div class="auth-layout">
    <aside>
      <a class="brand inverse" routerLink="/"><img src="/branding/rentify-logo.png" alt="Rentify" /></a>
      <h2>Los mejores planes<br />empiezan con<br /><em>un lugar.</em></h2>
      <p>Escapate de la rutina.<br />Encontrá tu próxima estadía.</p>
      <img src="/house.svg" alt="Casa entre montañas" />
    </aside>
    <section class="auth-content">
      <a routerLink="/" class="back">← Volver al inicio</a
      ><span class="eyebrow">BIENVENIDO A RENTIFY</span>
      <h1>{{ title }}</h1>
      <app-status [error]="error" [success]="success" [loading]="busy" />
      @if (mode === 'revisa') {
        <p>
          Tu cuenta fue creada. Revisá tu correo para verificarla. Si no lo encontrás, revisá la
          carpeta de spam.
        </p>
        <a class="button" routerLink="/auth/login">Ir a iniciar sesión</a
        ><a class="text-link" routerLink="/auth/reenviar">Reenviar correo de verificación</a>
      } @else if (mode === 'verificado') {
        <p>
          {{
            verified
              ? 'Tu correo fue verificado correctamente. Ya podés iniciar sesión.'
              : 'Estamos comprobando el enlace de verificación…'
          }}
        </p>
        @if (verified) {
          <a class="button" routerLink="/auth/login">Iniciar sesión</a>
        }
        <a class="text-link" routerLink="/auth/reenviar">Solicitar otro enlace</a>
      } @else {
        <form (ngSubmit)="submit()">
          @if (mode === 'registro') {
            <div class="form-grid">
              <label
                >Nombre<input
                  name="nombre"
                  [(ngModel)]="data.nombre"
                  minlength="2"
                  maxlength="80"
                  required
                  autocomplete="given-name" /></label
              ><label
                >Apellido<input
                  name="apellido"
                  [(ngModel)]="data.apellido"
                  minlength="2"
                  maxlength="80"
                  required
                  autocomplete="family-name" /></label
              ><label
                >Documento<input
                  name="documento"
                  [(ngModel)]="data.documento"
                  minlength="5"
                  maxlength="30"
                  required /></label
              ><label
                >Teléfono<input
                  name="telefono"
                  [(ngModel)]="data.telefono"
                  type="tel"
                  required
                  autocomplete="tel"
              /></label>
            </div>
            <label
              >Fecha de nacimiento<input
                name="fecha_nacimiento"
                [(ngModel)]="data.fecha_nacimiento"
                type="date"
                required
            /></label>
          }
          @if (!passwordMode) {
            <label
              >Correo electrónico<input
                name="email"
                type="email"
                [(ngModel)]="data.email"
                autocomplete="email"
                required
                placeholder="vos@ejemplo.com"
            /></label>
          }
          @if (mode === 'login' || mode === 'registro' || passwordMode) {
            <label
              >{{ passwordMode ? 'Nueva contraseña' : 'Contraseña'
              }}<input
                name="password"
                type="password"
                [(ngModel)]="data.password"
                [attr.autocomplete]="mode === 'login' ? 'current-password' : 'new-password'"
                minlength="8"
                maxlength="72"
                required
            /></label>
          }
          @if (mode === 'registro' || passwordMode) {
            <label
              >Repetir contraseña<input
                name="confirmar"
                type="password"
                [(ngModel)]="data.confirmar_password"
                autocomplete="new-password"
                required
            /></label>
            <p class="small muted">Al menos 8 caracteres, una letra y un número.</p>
          }
          <button class="full" [disabled]="busy">{{ button }} ↗</button>
        </form>
        @if (mode === 'login') {
          <a class="text-link" routerLink="/auth/recuperar">Olvidé mi contraseña</a>
          <p class="muted">
            ¿Todavía no tenés cuenta? <a routerLink="/auth/registro">Registrate</a>
          </p>
          <a class="text-link" routerLink="/auth/reenviar">Reenviar correo de verificación</a>
        } @else {
          <a class="text-link" routerLink="/auth/login">Volver a iniciar sesión</a>
        }
      }
    </section>
  </div>`,
})
export class AuthPageComponent implements OnInit {
  auth = inject(Auth);
  api = inject(Api);
  route = inject(ActivatedRoute);
  router = inject(Router);
  mode = this.route.snapshot.data['mode'] || 'login';
  data: Record<string, string> = {};
  error = '';
  success = '';
  busy = false;
  verified = false;
  get passwordMode() {
    return ['restablecer', 'cambiar'].includes(this.mode);
  }
  get title() {
    return (
      {
        login: 'Qué bueno verte de nuevo',
        registro: 'Creá tu cuenta',
        revisa: 'Revisá tu correo',
        verificado: 'Verificación de correo',
        recuperar: 'Recuperá tu contraseña',
        reenviar: 'Un nuevo enlace',
        restablecer: 'Elegí una nueva contraseña',
        cambiar: 'Cambiar contraseña',
      } as Record<string, string>
    )[this.mode];
  }
  get button() {
    return (
      {
        login: 'Iniciar sesión',
        registro: 'Crear mi cuenta',
        recuperar: 'Enviar instrucciones',
        reenviar: 'Reenviar verificación',
        restablecer: 'Guardar contraseña',
        cambiar: 'Guardar contraseña',
      } as Record<string, string>
    )[this.mode];
  }
  async ngOnInit() {
    this.error = this.auth.configError();
    if (this.route.snapshot.queryParamMap.get('passwordUpdated') === '1') {
      this.success = 'Contraseña actualizada correctamente. Iniciá sesión con tu nueva contraseña.';
    }
    if (this.mode === 'verificado') {
      if (!this.auth.client) return;
      try {
        const hash = new URLSearchParams(location.hash.slice(1));
        if (hash.has('error')) {
          this.error = 'El enlace es inválido o ya venció. Solicitá uno nuevo.';
          return;
        }
        const { data } = await this.auth.client.auth.getUser();
        if (data.user?.email_confirmed_at) {
          this.verified = true;
          await this.auth.client.auth.signOut();
        } else this.error = 'No pudimos verificar el enlace. Solicitá uno nuevo.';
      } catch {
        this.error = 'No pudimos verificar el enlace. Solicitá uno nuevo.';
      } finally {
        history.replaceState(null, '', location.pathname);
      }
    }
  }
  async submit() {
    this.error = '';
    this.success = '';
    if (
      (this.mode === 'registro' || this.passwordMode) &&
      (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(this.data['password'] || '') ||
        this.data['password'] !== this.data['confirmar_password'])
    ) {
      this.error =
        'Las contraseñas deben coincidir y tener al menos 8 caracteres, una letra y un número.';
      return;
    }
    this.busy = true;
    try {
      if (this.mode === 'login') await this.auth.login(this.data['email'], this.data['password']);
      else if (this.mode === 'registro') {
        await this.api.request('/auth/register', 'POST', this.data);
        await this.router.navigateByUrl('/auth/revisa-tu-correo');
      } else if (this.mode === 'cambiar') {
        await this.auth.changePassword(this.data['password']);
        this.success = 'Contraseña actualizada correctamente. Podés continuar usando Rentify.';
      } else if (this.mode === 'restablecer') {
        await this.auth.completeRecoveryPassword(this.data['password']);
        await this.router.navigate(['/auth/login'], { queryParams: { passwordUpdated: 1 } });
      } else {
        const res = await this.api.request(
          `/auth/${this.mode === 'recuperar' ? 'recover' : 'resend-verification'}`,
          'POST',
          { email: this.data['email'] },
        );
        this.success = res.message;
      }
    } catch (e) {
      this.error = message(e);
    } finally {
      this.busy = false;
    }
  }
}
