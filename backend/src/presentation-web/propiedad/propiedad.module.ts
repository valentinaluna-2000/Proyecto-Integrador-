import { Module } from '@nestjs/common';
import { PropiedadLogicModule } from '../../business-persistent/propiedad/propiedad-logic.module';
import { PropiedadController } from './propiedad.controller';

@Module({ imports: [PropiedadLogicModule], controllers: [PropiedadController] })
export class PropiedadModule {}
