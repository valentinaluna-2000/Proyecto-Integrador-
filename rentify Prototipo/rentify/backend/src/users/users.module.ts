import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Cliente } from './entities/cliente.entity';
import { Administrador } from '../administradores/entities/administrador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Administrador])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
