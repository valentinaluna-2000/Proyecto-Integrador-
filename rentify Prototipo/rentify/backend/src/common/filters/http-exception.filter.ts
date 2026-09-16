import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Ocurrio un error interno en el servidor.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const anyBody = body as any;
        message = anyBody.message ?? message;
        error = anyBody.error ?? error;
      }
    } else if (exception instanceof Error) {
      // No exponer detalles internos ni stack traces al cliente.
      this.logger.error(exception.message, exception.stack);
      message = 'Ocurrio un error interno en el servidor.';
    }

    this.logger.warn(
      `${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
