import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private logger = new Logger('API');
  catch(error: unknown, host: ArgumentsHost) {
    let status = 500;
    let message: string | string[] = 'No se pudo completar la operación. Intentá nuevamente.';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const res = error.getResponse();
      message = typeof res === 'string' ? res : (res as { message: string | string[] }).message;
      if (status === 429) message = 'Demasiadas solicitudes. Esperá un minuto y volvé a intentar.';
      if (status === 413) message = 'El archivo supera el tamaño máximo permitido de 5 MB.';
      if (message === 'Not Found') message = 'No se encontró el recurso solicitado.';
      if (message === 'Validation failed (numeric string is expected)')
        message = 'El identificador debe ser un número entero válido.';
    } else if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code: string }).code;
      if (['23505', '23P01'].includes(code)) {
        status = 409;
        message = 'Los datos ya existen o las fechas dejaron de estar disponibles.';
      } else if (['23514', '23503', '23502'].includes(code)) {
        status = 400;
        message = 'Los datos no cumplen las reglas de integridad.';
      }
    }
    if (status === 500)
      this.logger.error('Error interno; no se registran datos de solicitud ni credenciales.');
    host.switchToHttp().getResponse().status(status).json({ statusCode: status, message });
  }
}
