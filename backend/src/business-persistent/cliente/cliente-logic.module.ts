import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteEntity } from './cliente.entity';
import { ClienteService } from './cliente.service';

@Module({ imports: [TypeOrmModule.forFeature([ClienteEntity])], providers: [ClienteService], exports: [ClienteService] })
export class ClienteLogicModule {}
