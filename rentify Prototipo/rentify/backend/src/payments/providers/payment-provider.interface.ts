export interface CreatePreferenceInput {
  reservationId: number;
  title: string;
  amount: number;
  payerEmail: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
}

export interface CreatePreferenceOutput {
  preferenceId: string;
  initPoint: string;
}

export interface ExternalPaymentInfo {
  id: string;
  status: string;
  statusDetail: string;
  amount: number;
  externalReference: string | null;
  raw: Record<string, any>;
}

/**
 * Adaptador de proveedor de pagos. La reserva y el resto del sistema nunca
 * dependen directamente del SDK concreto (Mercado Pago); dependen de esta
 * interfaz, lo que permite reemplazar la pasarela sin afectar el resto de
 * la arquitectura (requisito no funcional "Componente de Gestion de Pagos").
 */
export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface PaymentProvider {
  createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceOutput>;
  getPaymentInfo(externalPaymentId: string): Promise<ExternalPaymentInfo>;
}
