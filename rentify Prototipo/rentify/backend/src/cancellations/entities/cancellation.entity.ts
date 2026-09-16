import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum TipoUsuarioCancelacion {
  CLIENTE = 'cliente',
  ADMINISTRADOR = 'administrador',
}

@Entity('cancelaciones')
export class Cancellation {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Reservation, (reservation) => reservation.cancelacion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column({ name: 'reservation_id' })
  reservationId: number;

  @Column({ type: 'varchar', name: 'tipo_usuario' })
  tipoUsuario: TipoUsuarioCancelacion;

  @Column({ type: 'int', name: 'usuario_id' })
  usuarioId: number;

  @Column({ type: 'varchar', name: 'usuario_nombre' })
  usuarioNombre: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'boolean', name: 'es_excepcional', default: false })
  esExcepcional: boolean;

  @Column({ type: 'boolean', name: 'genero_reintegro', default: false })
  generoReintegro: boolean;
}
