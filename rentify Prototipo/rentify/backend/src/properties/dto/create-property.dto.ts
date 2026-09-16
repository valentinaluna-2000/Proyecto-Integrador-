import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PropertyType } from '../entities/property.entity';

export class CreatePropertyDto {
  @ApiProperty() @IsString() nombre: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() descripcion?: string;

  @ApiProperty({ enum: PropertyType })
  @IsIn(Object.values(PropertyType))
  tipo: PropertyType;

  @ApiProperty() @IsString() direccion: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() ciudad?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsNumber() latitud?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsNumber() longitud?: number;

  @ApiProperty() @IsInt() @Min(1) capacidad: number;

  @ApiProperty({ required: false, default: '14:00:00' })
  @IsOptional()
  @IsString()
  horaCheckin?: string;

  @ApiProperty({ required: false, default: '10:00:00' })
  @IsOptional()
  @IsString()
  horaCheckout?: string;

  @ApiProperty({ default: false }) @IsOptional() @IsBoolean() aceptaMascotas?: boolean;

  @ApiProperty({ default: true }) @IsOptional() @IsBoolean() aceptaMenores?: boolean;

  @ApiProperty({ default: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(36)
  limiteMesesReserva?: number;

  @ApiProperty() @IsNumber() @Min(0) precioNoche: number;

  @ApiProperty({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeSena?: number;

  @ApiProperty({ required: false, default: 'estandar' })
  @IsOptional()
  @IsString()
  politicaCancelacion?: string;
}
