import { Module } from '@nestjs/common';
import { PagoLogicModule } from '../../business-persistent/pago/pago-logic.module';
import { PagoController } from './pago.controller';

@Module({ imports: [PagoLogicModule], controllers: [PagoController] })
export class PagoModule {}
