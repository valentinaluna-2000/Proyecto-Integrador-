import { Module } from '@nestjs/common';
import { ImagenPropiedadLogicModule } from '../../business-persistent/imagen-propiedad/imagen-propiedad-logic.module';
import { ImagenPropiedadController } from './imagen-propiedad.controller';

@Module({ imports: [ImagenPropiedadLogicModule], controllers: [ImagenPropiedadController] })
export class ImagenPropiedadModule {}
