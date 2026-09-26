import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservaEntity } from './reserva.entity';
import { ReservaService } from './reserva.service';

@Module({ imports: [TypeOrmModule.forFeature([ReservaEntity])], providers: [ReservaService], exports: [ReservaService] })
export class ReservaLogicModule {}
