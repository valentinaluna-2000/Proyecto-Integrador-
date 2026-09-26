import { Module } from '@nestjs/common';
import { PropietarioLogicModule } from '../../business-persistent/propietario/propietario-logic.module';
import { PropietarioController } from './propietario.controller';

@Module({ imports: [PropietarioLogicModule], controllers: [PropietarioController] })
export class PropietarioModule {}
