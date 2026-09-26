import { Module } from '@nestjs/common';
import { ClienteLogicModule } from '../../business-persistent/cliente/cliente-logic.module';
import { ClienteController } from './cliente.controller';

@Module({ imports: [ClienteLogicModule], controllers: [ClienteController] })
export class ClienteModule {}
