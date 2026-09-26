import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancelacionEntity } from './cancelacion.entity';
import { CancelacionService } from './cancelacion.service';

@Module({ imports: [TypeOrmModule.forFeature([CancelacionEntity])], providers: [CancelacionService], exports: [CancelacionService] })
export class CancelacionLogicModule {}
