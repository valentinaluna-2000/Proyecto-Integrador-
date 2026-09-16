import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: false,
      auth: this.configService.get('SMTP_USER')
        ? {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASSWORD'),
          }
        : undefined,
      ignoreTLS: true,
    });
  }

  async sendPasswordReset(to: string, nombre: string, resetLink: string) {
    const from = this.configService.get<string>(
      'MAIL_FROM',
      'no-responder@rentify.local',
    );
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Rentify - Recuperacion de contrasena',
        html: `
          <p>Hola ${nombre},</p>
          <p>Recibimos una solicitud para restablecer tu contrasena en Rentify.</p>
          <p>Hace click en el siguiente enlace para elegir una nueva contrasena (valido por 1 hora):</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Si no solicitaste este cambio, podes ignorar este correo.</p>
        `,
      });
      this.logger.log(`Email de recuperacion enviado a ${to}`);
    } catch (error) {
      // No debe romper el flujo principal si el servidor de correo no esta disponible.
      this.logger.error(`No se pudo enviar el email de recuperacion a ${to}`, error);
    }
  }

  async sendReservationConfirmation(to: string, nombre: string, detalle: string) {
    const from = this.configService.get<string>(
      'MAIL_FROM',
      'no-responder@rentify.local',
    );
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Rentify - Reserva confirmada',
        html: `<p>Hola ${nombre},</p><p>Tu reserva fue confirmada.</p><p>${detalle}</p>`,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el email de confirmacion a ${to}`, error);
    }
  }
}
