import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

/**
 * Cliente del sistema: persona que consulta propiedades y realiza reservas.
 * Entidad independiente de Administrador/Propietario, tal como define el DER.
 */
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar' })
  apellido: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  telefono: string;

  @Column({ type: 'varchar' })
  contrasena: string;

  @Column({ type: 'date', name: 'fecha_nacimiento', nullable: true })
  fechaNacimiento: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', name: 'reset_password_token', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamptz', name: 'reset_password_expires', nullable: true })
  resetPasswordExpires: Date | null;

  @OneToMany(() => Reservation, (reservation) => reservation.cliente)
  reservas: Reservation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
