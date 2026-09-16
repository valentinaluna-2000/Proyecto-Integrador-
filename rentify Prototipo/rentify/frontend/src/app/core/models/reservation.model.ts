import { Property } from './property.model';

export type ReservationStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Payment {
  id: number;
  provider: string;
  externalPaymentId: string | null;
  monto: number;
  estado: string;
  statusDetail: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Cancellation {
  id: number;
  tipoUsuario: 'cliente' | 'administrador';
  usuarioNombre: string;
  fecha: string;
  motivo: string;
  esExcepcional: boolean;
  generoReintegro: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}

export interface Reservation {
  id: number;
  propertyId: number;
  clienteId: number;
  fechaDesde: string;
  fechaHasta: string;
  noches: number;
  precioNocheSnapshot: number;
  importeTotal: number;
  importeSena: number;
  estado: ReservationStatus;
  fechaVencimientoTemporal: string | null;
  createdAt: string;
  property?: Property;
  cliente?: Cliente;
  pagos?: Payment[];
  cancelacion?: Cancellation;
}

export interface ReservationSimulation {
  noches: number;
  importeTotal: number;
  importeSena: number;
  precioNoche: number;
}
