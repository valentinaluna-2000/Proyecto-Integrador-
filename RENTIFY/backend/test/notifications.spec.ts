import { NotificadorEmail } from '../src/notifications/notifier';
import { EmailEvent } from '../src/common/ports';
import { emailTemplate, GmailSmtpEmailProvider } from '../src/integrations/email/gmail.provider';
import { OutboxJob } from '../src/jobs/outbox.job';
const event: EmailEvent = {
  eventId: '123',
  type: 'EMAIL_VERIFICATION',
  version: 1,
  recipient: 'user@example.com',
  recipientName: '<Ana>',
  actionUrl: 'https://auth.example/verify?token=x',
  createdAt: new Date().toISOString(),
};
describe('Kafka → notificador → EmailProvider', () => {
  function setup(exists = false) {
    const tx = {
      query: jest.fn(),
      getRepository: () => ({ existsBy: jest.fn().mockResolvedValue(exists) }),
      save: jest.fn(),
    };
    const db = { transaction: jest.fn((fn) => fn(tx)) };
    const email = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordRecoveryEmail: jest.fn().mockResolvedValue(undefined),
    };
    const publisher = { publish: jest.fn() };
    return { tx, email, publisher, notifier: new NotificadorEmail(db as any, email, publisher) };
  }
  test('consume verificación y registra solo tras SMTP', async () => {
    const s = setup();
    await s.notifier.verification(event);
    expect(s.email.sendVerificationEmail).toHaveBeenCalledWith(event);
    expect(s.tx.save).toHaveBeenCalledTimes(1);
  });
  test('consume recovery con proveedor apropiado', async () => {
    const s = setup();
    const e = { ...event, type: 'PASSWORD_RECOVERY' as const };
    await s.notifier.recovery(e);
    expect(s.email.sendPasswordRecoveryEmail).toHaveBeenCalledWith(e);
  });
  test('eventId ya procesado no duplica correo', async () => {
    const s = setup(true);
    await s.notifier.verification(event);
    expect(s.email.sendVerificationEmail).not.toHaveBeenCalled();
  });
  test('fallo SMTP reintenta y envía a DLQ sin marcar enviado', async () => {
    const s = setup();
    s.email.sendVerificationEmail.mockRejectedValue(new Error('SMTP'));
    await s.notifier.verification(event);
    expect(s.email.sendVerificationEmail).toHaveBeenCalledTimes(3);
    expect(s.publisher.publish).toHaveBeenCalledWith('rentify.notifications.dlq', event);
    expect(s.tx.save).not.toHaveBeenCalled();
  });
  test('template HTML escapa contenido y ofrece texto alternativo', () => {
    const template = emailTemplate(event, false);
    expect(template.html).toContain('&lt;Ana&gt;');
    expect(template.html).toContain('VERIFICAR MI CUENTA');
    expect(template.text).toContain(event.actionUrl);
  });
  test('Gmail provider solo acepta envío cuando SMTP acepta destinatario', async () => {
    const provider = Object.create(GmailSmtpEmailProvider.prototype);
    provider.transport = {
      sendMail: jest.fn().mockResolvedValue({ accepted: ['user@example.com'] }),
    };
    process.env.SMTP_FROM = 'rentify@example.com';
    await provider.sendVerificationEmail(event);
    expect(provider.transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: event.recipient, subject: 'Verificá tu cuenta de Rentify' }),
    );
    provider.transport.sendMail.mockResolvedValue({ accepted: [] });
    await expect(
      provider.sendPasswordRecoveryEmail({ ...event, type: 'PASSWORD_RECOVERY' }),
    ).rejects.toThrow();
  });
  test('outbox publica evento Kafka y elimina enlace tras publicar', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 1, event_id: '123', topic: 'topic', payload: event }])
        .mockResolvedValue([]),
    };
    const db = { transaction: jest.fn((fn) => fn(tx)) };
    const publisher = { publish: jest.fn() };
    await new OutboxJob(db as any, publisher).flush();
    expect(publisher.publish).toHaveBeenCalledWith('topic', event);
    expect(tx.query.mock.calls[1][1][1]).not.toContain('actionUrl');
  });
});
