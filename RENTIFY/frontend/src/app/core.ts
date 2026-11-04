import { Injectable, signal, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { synchronizeAuthSession } from './auth-session';
export interface User {
  id: number;
  role: 'CLIENTE' | 'ADMINISTRADOR';
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}
export interface Property {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  direccion: string;
  latitud: string;
  longitud: string;
  capacidad: number;
  cantidad_habitaciones: number;
  cantidad_banos: number;
  hora_checkin: string;
  hora_checkout: string;
  acepta_mascotas: boolean;
  acepta_menores: boolean;
  limite_meses_reserva: number;
  precio_noche: string;
  porcentaje_sena: string;
  estado: string;
  imagenes: { id: number; url: string; orden: number }[];
}
@Injectable({ providedIn: 'root' })
export class Api {
  base = '/api';
  token: () => Promise<string | undefined> = async () => undefined;
  async request<T = any>(path: string, method = 'GET', data?: unknown): Promise<T> {
    const token = await this.token();
    const form = data instanceof FormData;
    let response: Response;
    try {
      response = await fetch(`${this.base}${path}`, {
        method,
        headers: {
          ...(!form ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(data ? { body: form ? data : JSON.stringify(data) } : {}),
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      throw new Error('No pudimos conectar con Rentify. Intentá nuevamente en unos instantes.');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        Array.isArray(body.message)
          ? body.message.join(' ')
          : body.message || 'No se pudo completar la operación.',
      );
    return body;
  }
}
@Injectable({ providedIn: 'root' })
export class Auth {
  api = inject(Api);
  router = inject(Router);
  user = signal<User | null>(null);
  ready = signal(false);
  configError = signal('');
  client?: SupabaseClient;
  mapsKey = '';
  recoverySession = signal(false);
  async init() {
    try {
      const local = await fetch('/config.json').then((r) => r.json());
      this.api.base = local.apiUrl || '/api';
      const config = await this.api.request('/config');
      this.mapsKey = config.googleMapsKey;
      if (!config.supabaseUrl || !config.supabaseAnonKey)
        throw new Error('Falta configurar Supabase en el servidor.');
      this.client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      this.api.token = async () =>
        (await this.client!.auth.getSession()).data.session?.access_token;
      this.client.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') this.recoverySession.set(true);
        if (!session) this.user.set(null);
        else setTimeout(() => void this.refresh(), 0);
      });
      await this.refresh();
    } catch (e) {
      this.configError.set(message(e));
    } finally {
      this.ready.set(true);
    }
  }
  async refresh() {
    if (!this.client) return;
    const { data } = await this.client.auth.getSession();
    if (data.session) {
      try {
        this.user.set(await this.api.request<User>('/auth/me'));
      } catch {
        this.user.set(null);
      }
    } else this.user.set(null);
  }
  async syncSession(refreshToken = false) {
    if (!this.client) throw new Error('Autenticación no disponible.');
    const user = await synchronizeAuthSession(
      this.client,
      () => this.api.request<User>('/auth/me'),
      refreshToken,
    );
    this.user.set(user);
    if (!user) throw new Error('No se pudo sincronizar tu sesión de Rentify.');
  }
  async login(email: string, password: string) {
    if (!this.client) throw new Error('El servicio de autenticación no está configurado.');
    const { data: loginData, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error)
      throw new Error(
        error.code === 'email_not_confirmed'
          ? 'Primero debés verificar tu correo electrónico.'
          : 'Correo o contraseña incorrectos.',
      );
    if (!loginData.user?.email_confirmed_at) {
      await this.client.auth.signOut();
      throw new Error('Primero debés verificar tu correo electrónico.');
    }
    await this.syncSession();
    if (!this.user()) {
      await this.client.auth.signOut();
      throw new Error('No se pudo obtener el perfil de Rentify.');
    }
    const intent = localStorage.getItem('rentify-intent');
    if (intent && this.user()?.role === 'CLIENTE') {
      try {
        const data = JSON.parse(intent);
        await this.router.navigate(['/propiedades', data.propiedad_id], {
          queryParams: {
            desde: data.fecha_desde,
            hasta: data.fecha_hasta,
            huespedes: data.cantidad_huespedes,
          },
        });
        return;
      } catch {
        localStorage.removeItem('rentify-intent');
      }
    }
    await this.router.navigateByUrl(
      this.user()?.role === 'ADMINISTRADOR' ? '/admin' : '/mis-reservas',
    );
  }
  async logout() {
    await this.client?.auth.signOut();
    this.user.set(null);
    await this.router.navigateByUrl('/');
  }
  async changePassword(password: string) {
    if (!this.client) throw new Error('Autenticación no disponible.');
    const { error } = await this.client.auth.updateUser({ password });
    if (error)
      throw new Error('No se pudo cambiar la contraseña. Verificá que el enlace no haya vencido.');
    this.recoverySession.set(false);
    await this.syncSession(true);
  }
  async completeRecoveryPassword(password: string) {
    if (!this.client) throw new Error('Autenticación no disponible.');
    const { error } = await this.client.auth.updateUser({ password });
    if (error)
      throw new Error('No se pudo cambiar la contraseña. Verificá que el enlace no haya vencido.');
    await this.client.auth.signOut();
    this.recoverySession.set(false);
    this.user.set(null);
  }
}
export const message = (e: unknown) =>
  e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
export const authenticated: CanActivateFn = async (_route, state) => {
  const auth = inject(Auth),
    router = inject(Router);
  if (!auth.ready()) await auth.init();
  return auth.user()
    ? true
    : router.createUrlTree(['/auth/login'], { queryParams: { volver: state.url } });
};
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(Auth),
    router = inject(Router);
  if (!auth.ready()) await auth.init();
  return auth.user()?.role === 'ADMINISTRADOR' ? true : router.createUrlTree(['/auth/login']);
};
export const money = (n: string | number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(n));
export const dateLabel = (s: string) =>
  new Date(s.length === 10 ? `${s}T12:00:00-03:00` : s).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Cordoba',
  });
