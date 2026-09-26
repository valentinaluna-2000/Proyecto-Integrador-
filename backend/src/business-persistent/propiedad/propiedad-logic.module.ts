import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropiedadEntity } from './propiedad.entity';
import { PropiedadService } from './propiedad.service';

@Module({ imports: [TypeOrmModule.forFeature([PropiedadEntity])], providers: [PropiedadService], exports: [PropiedadService] })
export class PropiedadLogicModule {}
