import { Module } from '@nestjs/common';
import { PeriodoBloqueadoLogicModule } from '../../business-persistent/periodo-bloqueado/periodo-bloqueado-logic.module';
import { PeriodoBloqueadoController } from './periodo-bloqueado.controller';

@Module({ imports: [PeriodoBloqueadoLogicModule], controllers: [PeriodoBloqueadoController] })
export class PeriodoBloqueadoModule {}
