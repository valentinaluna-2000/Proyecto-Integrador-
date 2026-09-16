export type PropertyType = 'casa' | 'cabana' | 'departamento' | 'quinta';
export type PropertyStatus = 'activa' | 'inactiva';

export interface PropertyImage {
  id: number;
  url: string;
  orden: number;
}

export interface Property {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: PropertyType;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  capacidad: number;
  horaCheckin: string;
  horaCheckout: string;
  aceptaMascotas: boolean;
  aceptaMenores: boolean;
  limiteMesesReserva: number;
  precioNoche: number;
  porcentajeSena: number;
  estado: PropertyStatus;
  politicaCancelacion: string;
  imagenes: PropertyImage[];
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PropertyQuery {
  ciudad?: string;
  tipo?: PropertyType;
  precioMin?: number;
  precioMax?: number;
  capacidadMinima?: number;
  aceptaMascotas?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface Availability {
  propertyId: number;
  limiteMesesReserva: number;
  periodosBloqueados: { fechaDesde: string; fechaHasta: string; motivo: string }[];
  periodosReservados: { fechaDesde: string; fechaHasta: string; estado: string }[];
}
