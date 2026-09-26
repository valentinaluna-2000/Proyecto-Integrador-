import { Controller } from '@nestjs/common';
import { ReservaService } from '../../business-persistent/reserva/reserva.service';

@Controller('reservas')
export class ReservaController {
  constructor(private readonly service: ReservaService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
