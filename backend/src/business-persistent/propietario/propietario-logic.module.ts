import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropietarioEntity } from './propietario.entity';
import { PropietarioService } from './propietario.service';

@Module({ imports: [TypeOrmModule.forFeature([PropietarioEntity])], providers: [PropietarioService], exports: [PropietarioService] })
export class PropietarioLogicModule {}
