import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PropertyType } from '../entities/property.entity';

export class QueryPropertiesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() ciudad?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsIn(Object.values(PropertyType))
  tipo?: PropertyType;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) precioMin?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) precioMax?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() capacidadMinima?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  aceptaMascotas?: boolean;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;
}
