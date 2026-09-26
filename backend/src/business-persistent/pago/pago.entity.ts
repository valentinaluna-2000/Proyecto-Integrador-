import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReservaEntity } from '../reserva/reserva.entity';

@Entity({ name: 'pago' })
export class PagoEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'reserva_id' }) reservaId: number;
  @ManyToOne(() => ReservaEntity, (r) => r.pagos) @JoinColumn({ name: 'reserva_id' }) reserva: ReservaEntity;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) monto: string;
  @Column({ type: 'timestamptz' }) fecha: Date;
  @Column({ type: 'varchar' }) estado: string;
  @Column({ name: 'id_transaccion_externa', type: 'varchar' }) idTransaccionExterna: string;
}
