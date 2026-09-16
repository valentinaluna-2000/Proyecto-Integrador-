export type Role = 'ADMINISTRADOR' | 'CLIENTE';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  nombre: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ClienteProfile {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  role: Role;
}

export interface AdministradorProfile {
  id: number;
  usuario: string;
  email: string;
  rol: string;
  propietarioId: number;
  role: Role;
}
