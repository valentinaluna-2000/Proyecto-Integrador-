import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PropertyImagesService } from './property-images.service';
import { PropertyImagesController } from './property-images.controller';
import { PropertyImage } from './entities/property-image.entity';
import { Property } from '../properties/entities/property.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyImage, Property]),
    MulterModule.register(),
  ],
  controllers: [PropertyImagesController],
  providers: [PropertyImagesService],
})
export class PropertyImagesModule {}
