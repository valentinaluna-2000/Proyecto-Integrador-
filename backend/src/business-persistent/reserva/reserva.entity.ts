import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PropiedadEntity } from '../propiedad/propiedad.entity';
import { ClienteEntity } from '../cliente/cliente.entity';
import { PagoEntity } from '../pago/pago.entity';
import { CancelacionEntity } from '../cancelacion/cancelacion.entity';

@Entity({ name: 'reserva' })
export class ReservaEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'propiedad_id' }) propiedadId: number;
  @ManyToOne(() => PropiedadEntity, (p) => p.reservas) @JoinColumn({ name: 'propiedad_id' }) propiedad: PropiedadEntity;
  @Column({ name: 'cliente_id' }) clienteId: number;
  @ManyToOne(() => ClienteEntity, (c) => c.reservas) @JoinColumn({ name: 'cliente_id' }) cliente: ClienteEntity;
  @Column({ name: 'fecha_desde', type: 'date' }) fechaDesde: string;
  @Column({ name: 'fecha_hasta', type: 'date' }) fechaHasta: string;
  @Column({ name: 'fecha_creacion', type: 'timestamptz' }) fechaCreacion: Date;
  @Column({ name: 'fecha_vencimiento_temporal', type: 'timestamptz' }) fechaVencimientoTemporal: Date;
  @Column({ name: 'cantidad_huespedes' }) cantidadHuespedes: number;
  @Column({ type: 'varchar' }) estado: string;
  @Column({ name: 'importe_total', type: 'decimal', precision: 12, scale: 2 }) importeTotal: string;
  @Column({ name: 'importe_sena', type: 'decimal', precision: 12, scale: 2 }) importeSena: string;
  @OneToMany(() => PagoEntity, (p) => p.reserva) pagos: PagoEntity[];
  @OneToOne(() => CancelacionEntity, (c) => c.reserva) cancelacion?: CancelacionEntity;
}
