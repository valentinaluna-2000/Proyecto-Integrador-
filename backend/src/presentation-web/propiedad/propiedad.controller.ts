import { Controller } from '@nestjs/common';
import { PropiedadService } from '../../business-persistent/propiedad/propiedad.service';

@Controller('propiedades')
export class PropiedadController {
  constructor(private readonly service: PropiedadService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
