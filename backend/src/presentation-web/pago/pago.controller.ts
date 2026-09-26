import { Controller } from '@nestjs/common';
import { PagoService } from '../../business-persistent/pago/pago.service';

@Controller('pagos')
export class PagoController {
  constructor(private readonly service: PagoService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
