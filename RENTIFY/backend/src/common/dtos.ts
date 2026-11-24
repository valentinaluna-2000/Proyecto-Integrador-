import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  ValidateIf,
  IsEnum,
  IsNumber,
  IsIn,
} from 'class-validator';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropiedadEstado } from './domain';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export class EmailDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Ingresá un correo electrónico válido.' })
  @MaxLength(254)
  email!: string;
}
export class RegisterDto extends EmailDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) nombre!: string;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) apellido!: string;
  @ApiProperty()
  @Transform(trim)
  @Matches(/^[\w.-]{5,30}$/, { message: 'Documento inválido.' })
  documento!: string;
  @ApiProperty() @Matches(/^[+\d ()-]{7,30}$/, { message: 'Teléfono inválido.' }) telefono!: string;
  @ApiProperty() @IsDateString({ strict: true }) fecha_nacimiento!: string;
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una letra y un número.',
  })
  password!: string;
  @ApiProperty() @IsString() confirmar_password!: string;
}
export class ProfileDto {
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  apellido?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Matches(/^[+\d ()-]{7,30}$/)
  telefono?: string;
}
export class RangeDto {
  @ApiProperty()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha_desde!: string;
  @ApiProperty()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha_hasta!: string;
}
export class ReserveDto extends RangeDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) propiedad_id!: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) @Max(100) cantidad_huespedes!: number;
}
export class BlockDto extends RangeDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(3) @MaxLength(300) motivo!: string;
}
export class CancelDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(3) @MaxLength(500) motivo!: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  es_excepcional?: boolean;
}
export class PropertyDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(3) @MaxLength(120) nombre!: string;
  @ApiProperty() @IsIn(['casa', 'departamento', 'cabaña', 'quinta']) tipo!: string;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(10) @MaxLength(5000) descripcion!: string;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(5) @MaxLength(250) direccion!: string;
  @ApiProperty() @IsNumber() @Min(-90) @Max(90) latitud!: number;
  @ApiProperty() @IsNumber() @Min(-180) @Max(180) longitud!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(100) capacidad!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(50) cantidad_habitaciones!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(50) cantidad_banos!: number;
  @ApiProperty() @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/) hora_checkin!: string;
  @ApiProperty() @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/) hora_checkout!: string;
  @ApiProperty() @IsBoolean() acepta_mascotas!: boolean;
  @ApiProperty() @IsBoolean() acepta_menores!: boolean;
  @ApiProperty() @IsInt() @Min(1) @Max(36) limite_meses_reserva!: number;
  @ApiProperty() @Matches(/^\d{1,10}(\.\d{1,2})?$/) precio_noche!: string;
  @ApiProperty() @Matches(/^\d{1,3}(\.\d{1,2})?$/) porcentaje_sena!: string;
  @ApiProperty() @IsEnum(PropiedadEstado) estado!: PropiedadEstado;
}
export class UpdatePropertyDto extends PartialType(PropertyDto, { skipNullProperties: false }) {}
export class PaginationDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 12 })
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 12;
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export class ReportDto {
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propiedad_id?: number;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  fecha_desde?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  fecha_hasta?: string;
}
export class OrderDto {
  @ApiProperty() @IsInt() @Min(0) orden!: number;
}

export class FiltersDto extends PaginationDto {
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(100)
  ubicacion?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacidad?: number;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_min?: number;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_max?: number;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['true', 'false'])
  mascotas?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['true', 'false'])
  menores?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  fecha_desde?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  fecha_hasta?: string;
}
