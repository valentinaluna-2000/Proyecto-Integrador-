import { Controller } from '@nestjs/common';
import { PropietarioService } from '../../business-persistent/propietario/propietario.service';

@Controller('propietarios')
export class PropietarioController {
  constructor(private readonly service: PropietarioService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
