import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoEntity } from './pago.entity';
import { PagoService } from './pago.service';

@Module({ imports: [TypeOrmModule.forFeature([PagoEntity])], providers: [PagoService], exports: [PagoService] })
export class PagoLogicModule {}
