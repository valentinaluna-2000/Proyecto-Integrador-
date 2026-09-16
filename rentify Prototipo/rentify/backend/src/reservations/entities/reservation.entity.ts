import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { Cliente } from '../../users/entities/cliente.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Cancellation } from '../../cancellations/entities/cancellation.entity';

/**
 * Estados de una reserva. Definidos explicitamente segun el Prompt Maestro,
 * formalizando el ciclo de vida descripto narrativamente en el PDF oficial.
 */
export enum ReservationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('reservas')
@Index(['propertyId', 'fechaDesde', 'fechaHasta'])
@Index(['clienteId'])
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Property, (property) => property.reservas, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'property_id' })
  propertyId: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.reservas, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({ type: 'date', name: 'fecha_desde' })
  fechaDesde: string;

  @Column({ type: 'date', name: 'fecha_hasta' })
  fechaHasta: string;

  @Column({ type: 'int' })
  noches: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'precio_noche_snapshot' })
  precioNocheSnapshot: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'importe_total' })
  importeTotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'importe_sena' })
  importeSena: number;

  @Column({
    type: 'varchar',
    default: ReservationStatus.PENDING_PAYMENT,
  })
  @Index()
  estado: ReservationStatus;

  @Column({ type: 'timestamptz', name: 'fecha_vencimiento_temporal', nullable: true })
  fechaVencimientoTemporal: Date | null;

  @OneToMany(() => Payment, (payment) => payment.reservation)
  pagos: Payment[];

  @OneToOne(() => Cancellation, (cancellation) => cancellation.reservation)
  cancelacion: Cancellation;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
