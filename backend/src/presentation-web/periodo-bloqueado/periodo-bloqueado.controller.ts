import { Controller } from '@nestjs/common';
import { PeriodoBloqueadoService } from '../../business-persistent/periodo-bloqueado/periodoBloqueado.service';

@Controller('periodos-bloqueados')
export class PeriodoBloqueadoController {
  constructor(private readonly service: PeriodoBloqueadoService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
