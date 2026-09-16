import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  IN_PROCESS = 'in_process',
}

@Entity('pagos')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reservation, (reservation) => reservation.pagos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column({ name: 'reservation_id' })
  reservationId: number;

  @Column({ type: 'varchar', default: 'mercadopago' })
  provider: string;

  @Column({ type: 'varchar', name: 'external_payment_id', nullable: true })
  @Index()
  externalPaymentId: string | null;

  @Column({ type: 'varchar', name: 'external_preference_id', nullable: true })
  externalPreferenceId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  estado: PaymentStatus;

  @Column({ type: 'varchar', name: 'status_detail', nullable: true })
  statusDetail: string | null;

  @Column({ type: 'timestamptz', name: 'paid_at', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'jsonb', name: 'raw_payload', nullable: true })
  rawPayload: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
