import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagenPropiedadEntity } from './imagen-propiedad.entity';
import { ImagenPropiedadService } from './imagenPropiedad.service';

@Module({ imports: [TypeOrmModule.forFeature([ImagenPropiedadEntity])], providers: [ImagenPropiedadService], exports: [ImagenPropiedadService] })
export class ImagenPropiedadLogicModule {}
