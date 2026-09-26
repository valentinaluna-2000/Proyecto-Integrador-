import { Module } from '@nestjs/common';
import { CancelacionLogicModule } from '../../business-persistent/cancelacion/cancelacion-logic.module';
import { CancelacionController } from './cancelacion.controller';

@Module({ imports: [CancelacionLogicModule], controllers: [CancelacionController] })
export class CancelacionModule {}
