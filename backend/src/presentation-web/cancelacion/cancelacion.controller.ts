import { Controller } from '@nestjs/common';
import { CancelacionService } from '../../business-persistent/cancelacion/cancelacion.service';

@Controller('cancelaciones')
export class CancelacionController {
  constructor(private readonly service: CancelacionService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
