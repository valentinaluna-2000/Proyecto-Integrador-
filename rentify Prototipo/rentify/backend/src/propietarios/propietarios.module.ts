import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Propietario } from './entities/propietario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Propietario])],
  exports: [TypeOrmModule],
})
export class PropietariosModule {}
