import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReservaEntity } from '../reserva/reserva.entity';
import { CancelacionEntity } from '../cancelacion/cancelacion.entity';

@Entity({ name: 'cliente' })
export class ClienteEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'auth_user_id', type: 'uuid', unique: true }) authUserId: string;
  @Column({ type: 'varchar' }) nombre: string;
  @Column({ type: 'varchar' }) apellido: string;
  @Column({ type: 'varchar' }) documento: string;
  @Column({ type: 'varchar' }) email: string;
  @Column({ type: 'varchar' }) telefono: string;
  @Column({ name: 'fecha_nacimiento', type: 'date' }) fechaNacimiento: string;
  @OneToMany(() => ReservaEntity, (r) => r.cliente) reservas: ReservaEntity[];
  @OneToMany(() => CancelacionEntity, (c) => c.cliente) cancelaciones: CancelacionEntity[];
}
