import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenMeteoAdapter {
  // Adaptador externo aislado de los servicios de dominio.
  // TODO: consultar pronóstico mediante Open-Meteo; no bloquear operaciones principales si falla.
}

