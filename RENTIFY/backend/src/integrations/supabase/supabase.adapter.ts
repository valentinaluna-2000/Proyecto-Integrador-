import { Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IAutenticacion, ImageStorage } from '../../common/ports';
import { required, env } from '../../common/config';
import { randomUUID } from 'crypto';
@Injectable()
export class SupabaseAuthAdapter extends IAutenticacion {
  readonly client: SupabaseClient = createClient(
    required('SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  async signup(email: string, password: string) {
    const { data, error } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });
    if (error || !data.user)
      throw new ServiceUnavailableException(
        'No se pudo crear la cuenta. Intentá nuevamente o recuperá tu contraseña.',
      );
    try {
      return await this.verification(email);
    } catch (e) {
      await this.deleteUser(data.user.id);
      throw e;
    }
  }
  async verification(email: string) {
    // GoTrue accepts an existing signup without changing its password; password is optional server-side.
    const { data, error } = await this.client.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: `${required('FRONTEND_URL')}/auth/verificado` },
    } as Parameters<typeof this.client.auth.admin.generateLink>[0]);
    if (error || !data.user || !data.properties?.action_link)
      throw new ServiceUnavailableException('No se pudo generar el enlace de verificación.');
    const url = new URL(data.properties.action_link);
    url.searchParams.set('redirect_to', `${required('FRONTEND_URL')}/auth/verificado`);
    return { id: data.user.id, actionUrl: url.toString() };
  }
  async recovery(email: string) {
    const { data, error } = await this.client.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${required('FRONTEND_URL')}/auth/restablecer-contrasena` },
    });
    if (error || !data.user) throw new ServiceUnavailableException('No se pudo generar el enlace.');
    return { id: data.user.id, actionUrl: data.properties.action_link };
  }
  async identity(token: string) {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user)
      throw new UnauthorizedException('Tu sesión venció. Iniciá sesión nuevamente.');
    return { id: data.user.id, email: data.user.email, verified: !!data.user.email_confirmed_at };
  }
  async isVerified(id: string) {
    const { data, error } = await this.client.auth.admin.getUserById(id);
    if (error) throw new ServiceUnavailableException();
    return !!data.user?.email_confirmed_at;
  }
  async deleteUser(id: string) {
    const { error } = await this.client.auth.admin.deleteUser(id);
    if (error) throw new ServiceUnavailableException('No se pudo revertir el registro.');
  }
}
@Injectable()
export class SupabaseImageStorage extends ImageStorage {
  constructor(private readonly auth: SupabaseAuthAdapter) {
    super();
  }
  async upload(propertyId: number, file: Express.Multer.File) {
    const bucket = this.auth.client.storage.from(env('SUPABASE_STORAGE_BUCKET', 'property-images'));
    const path = `${propertyId}/${randomUUID()}.${file.mimetype === 'image/png' ? 'png' : 'jpg'}`;
    const { error } = await bucket.upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) throw new ServiceUnavailableException('No se pudo guardar la imagen.');
    return { url: bucket.getPublicUrl(path).data.publicUrl, path };
  }
  async remove(path: string) {
    const { error } = await this.auth.client.storage
      .from(env('SUPABASE_STORAGE_BUCKET', 'property-images'))
      .remove([path]);
    if (error) throw new ServiceUnavailableException('No se pudo eliminar la imagen.');
  }
}
