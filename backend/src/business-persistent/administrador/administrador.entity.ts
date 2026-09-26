import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PropietarioEntity } from '../propietario/propietario.entity';

@Entity({ name: 'administrador' })
export class AdministradorEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'propietario_id' }) propietarioId: number;
  @ManyToOne(() => PropietarioEntity, (p) => p.administradores) @JoinColumn({ name: 'propietario_id' }) propietario: PropietarioEntity;
  @Column({ name: 'auth_user_id', type: 'uuid', unique: true }) authUserId: string;
  @Column({ type: 'varchar' }) nombre: string;
  @Column({ type: 'varchar' }) apellido: string;
  @Column({ type: 'varchar' }) email: string;
  @Column({ type: 'varchar' }) rol: string;
}
