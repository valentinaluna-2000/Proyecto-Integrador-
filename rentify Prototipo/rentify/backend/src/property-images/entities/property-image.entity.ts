import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';

@Entity('imagenes_propiedad')
export class PropertyImage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Property, (property) => property.imagenes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'property_id' })
  propertyId: number;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar', name: 'original_name', nullable: true })
  originalName: string;

  @Column({ type: 'int', nullable: true })
  size: number;

  @Column({ type: 'int', name: 'orden', default: 0 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
