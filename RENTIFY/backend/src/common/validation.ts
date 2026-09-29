import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
const names: Record<string, string> = {
  nombre: 'nombre',
  apellido: 'apellido',
  email: 'correo electrónico',
  password: 'contraseña',
  confirmar_password: 'confirmación de contraseña',
  documento: 'documento',
  telefono: 'teléfono',
  fecha_nacimiento: 'fecha de nacimiento',
  fecha_desde: 'fecha de ingreso',
  fecha_hasta: 'fecha de egreso',
  propiedad_id: 'propiedad',
  cantidad_huespedes: 'cantidad de huéspedes',
  precio_noche: 'precio por noche',
  porcentaje_sena: 'porcentaje de seña',
  limite_meses_reserva: 'anticipación máxima',
  cantidad_banos: 'cantidad de baños',
  cantidad_habitaciones: 'cantidad de habitaciones',
  hora_checkin: 'hora de ingreso',
  hora_checkout: 'hora de egreso',
  es_excepcional: 'cancelación excepcional',
};
export function validationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const label = names[error.property] || error.property.replaceAll('_', ' ');
    const messages = Object.keys(error.constraints || {}).map((key) =>
      key === 'whitelistValidation'
        ? `El campo «${label}» no está permitido.`
        : `Revisá el campo «${label}»: el valor está ausente o no cumple el formato y los límites permitidos.`,
    );
    return [...messages, ...validationMessages(error.children || [])];
  });
}
export const validationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new BadRequestException(validationMessages(errors)),
  });
