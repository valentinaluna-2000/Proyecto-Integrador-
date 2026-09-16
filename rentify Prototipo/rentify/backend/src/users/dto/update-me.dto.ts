import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches, MinLength } from 'class-validator';

export class UpdateMeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  apellido?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ required: false, description: 'Nueva contrasena (minimo 8 caracteres alfanumericos)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contrasena debe contener al menos una letra y un numero',
  })
  password?: string;
}
