import { Controller } from '@nestjs/common';
import { ImagenPropiedadService } from '../../business-persistent/imagen-propiedad/imagenPropiedad.service';

@Controller('imagenes-propiedad')
export class ImagenPropiedadController {
  constructor(private readonly service: ImagenPropiedadService) {}
  // TODO: exponer rutas REST cuando se definan permisos y contratos de API.
}
