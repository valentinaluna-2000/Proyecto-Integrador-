import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';
import { IAutenticacion, EmailEvent } from '../common/ports';
import { RegisterDto } from '../common/dtos';
import { Cliente, Administrador, Outbox } from '../persistence/entities';
export const VERIFICATION = 'rentify.auth.email-verification.requested';
export const RECOVERY = 'rentify.auth.password-recovery.requested';
export const GENERIC =
  'Si existe una cuenta asociada a ese correo, recibirás instrucciones para recuperar tu contraseña.';
@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private db: DataSource,
    private auth: IAutenticacion,
  ) {}
  private event(email: string, name: string, url: string, recovery = false): EmailEvent {
    return {
      eventId: randomUUID(),
      type: recovery ? 'PASSWORD_RECOVERY' : 'EMAIL_VERIFICATION',
      version: 1,
      recipient: email,
      recipientName: name,
      actionUrl: url,
      createdAt: new Date().toISOString(),
    };
  }
  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmar_password)
      throw new BadRequestException('Las contraseñas no coinciden.');
    const birth = DateTime.fromISO(dto.fecha_nacimiento);
    if (!birth.isValid || birth >= DateTime.now() || birth < DateTime.now().minus({ years: 120 }))
      throw new BadRequestException('La fecha de nacimiento no es válida.');
    if (
      (await this.db
        .getRepository(Cliente)
        .exists({ where: [{ email: dto.email }, { documento: dto.documento }] })) ||
      (await this.db.getRepository(Administrador).existsBy({ email: dto.email }))
    )
      throw new ConflictException('El correo o documento ya están registrados.');
    // Serialize registrations per email, including the external Auth call.
    let createdId: string | undefined;
    try {
      await this.db.transaction(async (tx) => {
        await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [dto.email]);
        if (await tx.getRepository(Cliente).existsBy({ email: dto.email }))
          throw new ConflictException('La cuenta ya está registrada.');
        const link = await this.auth.signup(dto.email, dto.password);
        createdId = link.id;
        await tx.save(Cliente, {
          auth_user_id: link.id,
          nombre: dto.nombre,
          apellido: dto.apellido,
          documento: dto.documento,
          email: dto.email,
          telefono: dto.telefono,
          fecha_nacimiento: dto.fecha_nacimiento,
        });
        const event = this.event(dto.email, dto.nombre, link.actionUrl);
        await tx.save(Outbox, {
          event_id: event.eventId,
          topic: VERIFICATION,
          payload: { ...event },
          created_at: new Date(),
          published_at: null,
        });
      });
    } catch (e) {
      if (createdId) await this.auth.deleteUser(createdId);
      throw e;
    }
    return { message: 'Tu cuenta fue creada. Revisá tu correo para verificarla.' };
  }
  async sendLink(email: string, recovery: boolean) {
    const user =
      (await this.db.getRepository(Cliente).findOneBy({ email })) ||
      (await this.db.getRepository(Administrador).findOneBy({ email }));
    if (user) {
      try {
        if (recovery || !(await this.auth.isVerified(user.auth_user_id))) {
          const link = recovery
            ? await this.auth.recovery(email)
            : await this.auth.verification(email);
          const event = this.event(email, user.nombre, link.actionUrl, recovery);
          await this.db
            .getRepository(Outbox)
            .save({
              event_id: event.eventId,
              topic: recovery ? RECOVERY : VERIFICATION,
              payload: { ...event },
              created_at: new Date(),
              published_at: null,
            });
        }
      } catch {
        this.logger.warn('No se pudo generar una notificación de autenticación.');
      }
    }
    return {
      message: recovery
        ? GENERIC
        : 'Si la cuenta requiere verificación, recibirás un nuevo correo.',
    };
  }
}
