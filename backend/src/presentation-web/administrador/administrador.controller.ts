import { Controller } from '@nestjs/common';
import { AdministradorService } from '../../business-persistent/administrador/administrador.service';

@Controller('administradores')
export class AdministradorController {
  constructor(private readonly service: AdministradorService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
