import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength } from 'class-validator';

export class CreateBlockedPeriodDto {
  @ApiProperty({ example: '2026-12-01' })
  @IsDateString()
  fechaDesde: string;

  @ApiProperty({ example: '2026-12-10' })
  @IsDateString()
  fechaHasta: string;

  @ApiProperty({ example: 'Mantenimiento programado' })
  @IsString()
  @MaxLength(255)
  motivo: string;
}
