import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyImage } from './entities/property-image.entity';
import { Property } from '../properties/entities/property.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

@Injectable()
export class PropertyImagesService {
  constructor(
    @InjectRepository(PropertyImage)
    private imageRepo: Repository<PropertyImage>,
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
  ) {}

  async addImage(
    propertyId: number,
    file: { filename: string; originalname: string; size: number; mimetype: string },
    admin: JwtPayload,
  ) {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    if (property.propietarioId !== admin.propietarioId) {
      throw new BadRequestException('No tenes acceso a esta propiedad.');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imagenes en formato JPG o PNG.');
    }
    const maxBytes =
      parseInt(process.env.MAX_IMAGE_SIZE_MB || '5', 10) * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `La imagen supera el tamano maximo permitido (${process.env.MAX_IMAGE_SIZE_MB || 5}MB).`,
      );
    }
    const image = this.imageRepo.create({
      propertyId,
      url: `/uploads/properties/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    });
    return this.imageRepo.save(image);
  }

  async removeImage(propertyId: number, imageId: number, admin: JwtPayload) {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    if (property.propietarioId !== admin.propietarioId) {
      throw new BadRequestException('No tenes acceso a esta propiedad.');
    }
    const image = await this.imageRepo.findOne({
      where: { id: imageId, propertyId },
    });
    if (!image) throw new NotFoundException('Imagen no encontrada.');
    await this.imageRepo.remove(image);
    return { message: 'Imagen eliminada correctamente.' };
  }
}
