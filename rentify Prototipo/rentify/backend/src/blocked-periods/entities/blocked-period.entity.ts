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
import { Property } from '../../properties/entities/property.entity';

@Entity('periodos_bloqueados')
@Index(['propertyId', 'fechaDesde', 'fechaHasta'])
export class BlockedPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Property, (property) => property.periodosBloqueados, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'property_id' })
  propertyId: number;

  @Column({ type: 'date', name: 'fecha_desde' })
  fechaDesde: string;

  @Column({ type: 'date', name: 'fecha_hasta' })
  fechaHasta: string;

  @Column({ type: 'varchar' })
  motivo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
