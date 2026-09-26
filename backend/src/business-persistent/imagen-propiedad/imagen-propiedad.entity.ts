import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PropiedadEntity } from '../propiedad/propiedad.entity';

@Entity({ name: 'imagen_propiedad' })
export class ImagenPropiedadEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'propiedad_id' }) propiedadId: number;
  @ManyToOne(() => PropiedadEntity, (p) => p.imagenes) @JoinColumn({ name: 'propiedad_id' }) propiedad: PropiedadEntity;
  @Column({ type: 'varchar' }) url: string;
  @Column() orden: number;
}
