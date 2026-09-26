import { Controller } from '@nestjs/common';
import { ClienteService } from '../../business-persistent/cliente/cliente.service';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly service: ClienteService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
