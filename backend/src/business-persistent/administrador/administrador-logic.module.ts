import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministradorEntity } from './administrador.entity';
import { AdministradorService } from './administrador.service';

@Module({ imports: [TypeOrmModule.forFeature([AdministradorEntity])], providers: [AdministradorService], exports: [AdministradorService] })
export class AdministradorLogicModule {}
