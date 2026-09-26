import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodoBloqueadoEntity } from './periodo-bloqueado.entity';
import { PeriodoBloqueadoService } from './periodoBloqueado.service';

@Module({ imports: [TypeOrmModule.forFeature([PeriodoBloqueadoEntity])], providers: [PeriodoBloqueadoService], exports: [PeriodoBloqueadoService] })
export class PeriodoBloqueadoLogicModule {}
