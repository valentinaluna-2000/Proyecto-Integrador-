import Decimal from 'decimal.js';
import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
export enum ReservaEstado {
  TEMPORAL = 'TEMPORAL',
  CONFIRMADA = 'CONFIRMADA',
  VENCIDA = 'VENCIDA',
  CANCELADA = 'CANCELADA',
}
export enum PagoEstado {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  CANCELADO = 'CANCELADO',
}
export enum PropiedadEstado {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
}
export enum Rol {
  CLIENTE = 'CLIENTE',
  ADMINISTRADOR = 'ADMINISTRADOR',
}
export const ZONE = 'America/Argentina/Cordoba';
export interface Actor {
  id: number;
  auth_user_id: string;
  role: Rol;
  propietario_id?: number;
  nombre: string;
  apellido: string;
  email: string;
}
export function dates(from: string, to: string) {
  const a = DateTime.fromISO(from, { zone: ZONE }),
    b = DateTime.fromISO(to, { zone: ZONE });
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    !a.isValid ||
    !b.isValid ||
    b <= a
  )
    throw new BadRequestException('Las fechas deben ser válidas y el egreso posterior al ingreso.');
  return { a, b, nights: Math.round(b.diff(a, 'days').days) };
}
export function quote(from: string, to: string, price: string, percentage: string) {
  const { nights } = dates(from, to);
  const total = new Decimal(price).mul(nights).toDecimalPlaces(2);
  return {
    cantidad_noches: nights,
    importe_total: total.toFixed(2),
    importe_sena: total.mul(percentage).div(100).toDecimalPlaces(2).toFixed(2),
  };
}
export function validateStay(
  p: { capacidad: number; limite_meses_reserva: number },
  from: string,
  to: string,
  guests: number,
  now = DateTime.now().setZone(ZONE),
) {
  const { a, b } = dates(from, to);
  if (a < now.startOf('day'))
    throw new BadRequestException('La fecha de ingreso no puede estar en el pasado.');
  if (b > now.startOf('day').plus({ months: p.limite_meses_reserva }))
    throw new BadRequestException('Las fechas superan el límite de anticipación permitido.');
  if (!Number.isInteger(guests) || guests < 1 || guests > p.capacidad)
    throw new BadRequestException('La cantidad de huéspedes supera la capacidad o no es válida.');
}
export function validateCancellation(
  from: string,
  checkin: string,
  exceptional: boolean,
  actor: Actor,
  now = DateTime.now().setZone(ZONE),
) {
  const start = DateTime.fromISO(`${from}T${checkin}`, { zone: ZONE });
  if (start <= now) throw new BadRequestException('No se puede cancelar una reserva iniciada.');
  if (exceptional && actor.role !== Rol.ADMINISTRADOR)
    throw new BadRequestException('La cancelación excepcional requiere un administrador.');
  if (!exceptional && start.diff(now, 'hours').hours < 72)
    throw new BadRequestException('La cancelación requiere al menos 72 horas de anticipación.');
}
