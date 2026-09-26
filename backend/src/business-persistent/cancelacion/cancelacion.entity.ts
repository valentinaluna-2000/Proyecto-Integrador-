import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReservaEntity } from '../reserva/reserva.entity';
import { AdministradorEntity } from '../administrador/administrador.entity';
import { ClienteEntity } from '../cliente/cliente.entity';

@Entity({ name: 'cancelacion' })
export class CancelacionEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'reserva_id', unique: true }) reservaId: number;
  @OneToOne(() => ReservaEntity, (r) => r.cancelacion) @JoinColumn({ name: 'reserva_id' }) reserva: ReservaEntity;
  @Column({ name: 'administrador_id', nullable: true }) administradorId: number | null;
  @ManyToOne(() => AdministradorEntity, (a) => a.cancelaciones, { nullable: true }) @JoinColumn({ name: 'administrador_id' }) administrador: AdministradorEntity | null;
  @Column({ name: 'cliente_id', nullable: true }) clienteId: number | null;
  @ManyToOne(() => ClienteEntity, (c) => c.cancelaciones, { nullable: true }) @JoinColumn({ name: 'cliente_id' }) cliente: ClienteEntity | null;
  @Column({ name: 'tipo_usuario', type: 'varchar' }) tipoUsuario: string;
  @Column({ type: 'timestamptz' }) fecha: Date;
  @Column({ type: 'varchar' }) motivo: string;
  @Column({ name: 'es_excepcional' }) esExcepcional: boolean;
  @Column({ name: 'requiere_reintegro' }) requiereReintegro: boolean;
  // TODO(DER): agregar en migración CHECK para que exactamente una FK actor sea no nula.
}
