import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  const token = auth.token();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        notify.warning('Tu sesion expiro. Por favor, inicia sesion nuevamente.');
        router.navigate(['/auth/login']);
      } else if (error.status === 0) {
        notify.error('No se pudo conectar con el servidor. Intenta nuevamente.');
      } else if (error.status >= 500) {
        notify.error('Ocurrio un error interno en el servidor.');
      }
      return throwError(() => error);
    }),
  );
};
