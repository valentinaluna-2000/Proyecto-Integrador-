import { Module } from '@nestjs/common';
import { AdministradorLogicModule } from '../../business-persistent/administrador/administrador-logic.module';
import { AdministradorController } from './administrador.controller';

@Module({ imports: [AdministradorLogicModule], controllers: [AdministradorController] })
export class AdministradorModule {}
