import { Module } from '@nestjs/common';
import { ReservaLogicModule } from '../../business-persistent/reserva/reserva-logic.module';
import { ReservaController } from './reserva.controller';

@Module({ imports: [ReservaLogicModule], controllers: [ReservaController] })
export class ReservaModule {}
