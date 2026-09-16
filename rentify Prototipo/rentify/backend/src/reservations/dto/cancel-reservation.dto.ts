import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CancelReservationDto {
  @ApiProperty({ example: 'El huesped tuvo una emergencia familiar.' })
  @IsString()
  @MinLength(5)
  motivo: string;

  @ApiProperty({
    default: false,
    description:
      'Indica si la cancelacion corresponde a una causa excepcional (fuerza mayor, ' +
      'problemas graves en la propiedad, indisponibilidad, emergencia del cliente). ' +
      'Permite cancelar fuera de la ventana normal de 72 horas.',
  })
  @IsOptional()
  @IsBoolean()
  causaExcepcional?: boolean;
}
