import { Actor } from './domain';
export interface Identity {
  id: string;
  email?: string;
  verified: boolean;
}
export interface AuthLink {
  id: string;
  actionUrl: string;
}
export abstract class IAutenticacion {
  abstract signup(email: string, password: string): Promise<AuthLink>;
  abstract verification(email: string): Promise<AuthLink>;
  abstract recovery(email: string): Promise<AuthLink>;
  abstract identity(token: string): Promise<Identity>;
  abstract deleteUser(id: string): Promise<void>;
  abstract isVerified(id: string): Promise<boolean>;
}
export interface EmailEvent {
  eventId: string;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RECOVERY';
  version: 1;
  recipient: string;
  recipientName: string;
  actionUrl: string;
  createdAt: string;
}
export abstract class IEmailProvider {
  abstract sendVerificationEmail(data: EmailEvent): Promise<void>;
  abstract sendPasswordRecoveryEmail(data: EmailEvent): Promise<void>;
}
export abstract class EventPublisher {
  abstract publish(topic: string, event: EmailEvent): Promise<void>;
}
export abstract class ImageStorage {
  abstract upload(
    propertyId: number,
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }>;
  abstract remove(path: string): Promise<void>;
}
export interface ExternalPayment {
  id: string;
  external_reference: string;
  status: string;
  transaction_amount: number;
  currency_id: string;
  live_mode: boolean;
}
export abstract class PaymentGateway {
  abstract checkout(id: number, amount: string, description: string): Promise<string>;
  abstract payment(id: string): Promise<ExternalPayment>;
  abstract verifySignature(id: string, signature: string, requestId: string): void;
}
export abstract class WeatherProvider {
  abstract forecast(lat: string, lon: string, from: string, to: string): Promise<unknown>;
}
export interface ILogicaUsuarios {
  me(actor: Actor): Promise<unknown>;
}
export interface ILogicaPropiedades {
  get(id: number): Promise<unknown>;
}
export interface IDisponibilidad {
  check(id: number, from: string, to: string): Promise<unknown>;
}
export interface ILogicaReservas {
  detail(id: number, actor: Actor): Promise<unknown>;
}
export interface IActualizarReserva {
  expire(): Promise<void>;
}
export interface ILogicaCancelaciones {
  cancel(
    id: number,
    actor: Actor,
    data: { motivo: string; es_excepcional?: boolean },
  ): Promise<unknown>;
}
export interface ILogicaPagos {
  checkout(id: number, actor: Actor): Promise<unknown>;
}
export interface IConfirmacionPago {
  webhook(id: string, signature: string, requestId: string): Promise<unknown>;
}
export interface ILogicaReportes {
  report(kind: string, actor: Actor, filters: unknown): Promise<unknown>;
}
export interface ILogicaUbicacionClima {
  weather(id: number, from: string, to: string): Promise<unknown>;
}
