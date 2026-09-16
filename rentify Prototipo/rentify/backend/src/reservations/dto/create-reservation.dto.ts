import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  propertyId: number;

  @ApiProperty({ example: '2026-12-20' })
  @IsDateString()
  fechaDesde: string;

  @ApiProperty({ example: '2026-12-27' })
  @IsDateString()
  fechaHasta: string;
}
