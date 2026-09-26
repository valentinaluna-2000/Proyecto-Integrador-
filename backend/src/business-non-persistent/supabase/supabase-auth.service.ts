import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private readonly client: SupabaseClient;
  private readonly url: string;
  private readonly anonKey: string;
  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('SUPABASE_URL');
    this.anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    this.client = createClient(this.url, this.anonKey);
  }
  async register(email: string, password: string, emailRedirectTo?: string, profile?: { nombre: string; apellido: string }) {
    // Supabase Auth realiza registro y envío del correo de verificación.
    return this.client.auth.signUp({ email, password, options: { emailRedirectTo, data: profile } });
  }
  async login(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }
  async verifyEmail(email: string, token: string) {
    return this.client.auth.verifyOtp({ email, token, type: 'email' });
  }
  async recoverPassword(email: string, redirectTo?: string) {
    return this.client.auth.resetPasswordForEmail(email, { redirectTo });
  }
  async updatePassword(accessToken: string, password: string) {
    const scoped = this.forAccessToken(accessToken);
    return scoped.auth.updateUser({ password });
  }
  async logout(accessToken: string) {
    const scoped = this.forAccessToken(accessToken);
    return scoped.auth.signOut();
  }
  async validateAccessToken(accessToken: string) {
    // Verifica identidad con Supabase Auth; no se decodifica/valida JWT manualmente.
    const scoped = this.forAccessToken(accessToken);
    return scoped.auth.getUser(accessToken);
  }

  private forAccessToken(accessToken: string): SupabaseClient {
    return createClient(this.url, this.anonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } });
  }
}
