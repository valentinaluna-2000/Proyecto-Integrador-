import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Abril' })
  @IsString()
  @MaxLength(80)
  nombre: string;

  @ApiProperty({ example: 'Carballo' })
  @IsString()
  @MaxLength(80)
  apellido: string;

  @ApiProperty({ example: 'cliente@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Minimo 8 caracteres alfanumericos',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contrasena debe contener al menos una letra y un numero',
  })
  password: string;

  @ApiProperty({ required: false, example: '+54 353 4123456' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ required: false, example: '1998-05-10' })
  @IsOptional()
  @IsString()
  fechaNacimiento?: string;
}
