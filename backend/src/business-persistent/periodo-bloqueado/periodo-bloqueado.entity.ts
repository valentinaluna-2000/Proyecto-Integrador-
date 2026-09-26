import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PropiedadEntity } from '../propiedad/propiedad.entity';

@Entity({ name: 'periodo_bloqueado' })
export class PeriodoBloqueadoEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'propiedad_id' }) propiedadId: number;
  @ManyToOne(() => PropiedadEntity, (p) => p.periodosBloqueados) @JoinColumn({ name: 'propiedad_id' }) propiedad: PropiedadEntity;
  @Column({ name: 'fecha_desde', type: 'date' }) fechaDesde: string;
  @Column({ name: 'fecha_hasta', type: 'date' }) fechaHasta: string;
  @Column({ type: 'varchar' }) motivo: string;
}
