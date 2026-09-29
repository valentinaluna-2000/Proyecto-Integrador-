import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { IEmailProvider, EmailEvent } from '../../common/ports';
import { env, required } from '../../common/config';
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function emailTemplate(event: EmailEvent, recovery: boolean) {
  const subject = recovery ? 'Recuperá tu contraseña de Rentify' : 'Verificá tu cuenta de Rentify';
  const intro = recovery
    ? 'Recibimos una solicitud para restablecer tu contraseña.'
    : 'Gracias por registrarte. Para habilitar tu cuenta verificá tu dirección de correo electrónico.';
  const button = recovery ? 'RESTABLECER CONTRASEÑA' : 'VERIFICAR MI CUENTA';
  return {
    subject,
    text: `Rentify\nHola ${event.recipientName}.\n${intro}\n${event.actionUrl}\nSi no solicitaste este correo, podés ignorarlo.`,
    html: `<div style="font-family:Arial;max-width:560px;margin:auto;padding:32px;color:#163b36"><h1>Rentify</h1><p>Hola ${escapeHtml(event.recipientName)}.</p><p>${intro}</p><p><a style="display:inline-block;background:#176b57;color:white;padding:16px;border-radius:8px" href="${escapeHtml(event.actionUrl)}">${button}</a></p><p>Si el botón no funciona:</p><p>${escapeHtml(event.actionUrl)}</p><small>Si no solicitaste este correo, podés ignorarlo.</small></div>`,
  };
}
@Injectable()
export class GmailSmtpEmailProvider extends IEmailProvider {
  private transport = nodemailer.createTransport({
    host: env('SMTP_HOST', 'smtp.gmail.com'),
    port: Number(env('SMTP_PORT', '465')),
    secure: env('SMTP_SECURE', 'true') === 'true',
    auth: { user: required('SMTP_USER'), pass: required('SMTP_APP_PASSWORD') },
    connectionTimeout: 10000,
    socketTimeout: 20000,
    logger: false,
    debug: false,
  });
  async sendVerificationEmail(data: EmailEvent) {
    await this.send(data, false);
  }
  async sendPasswordRecoveryEmail(data: EmailEvent) {
    await this.send(data, true);
  }
  private async send(data: EmailEvent, recovery: boolean) {
    const result = await this.transport.sendMail({
      from: required('SMTP_FROM'),
      to: data.recipient,
      messageId: `<${data.eventId}@rentify.local>`,
      ...emailTemplate(data, recovery),
    });
    if (!result.accepted.length) throw new Error('SMTP no aceptó el destinatario.');
  }
}
