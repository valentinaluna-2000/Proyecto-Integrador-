import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Propietario } from '../../propietarios/entities/propietario.entity';

export enum RolAdministrador {
  TITULAR = 'titular',
  EMPLEADO = 'empleado',
}

/**
 * Cuenta de acceso al sistema del lado del propietario. Cada Propietario
 * puede tener varios Administradores (por ejemplo, el titular y empleados
 * con acceso restringido). Esta entidad es la que efectivamente inicia
 * sesion como rol ADMINISTRADOR en el sistema.
 */
@Entity('administradores')
export class Administrador {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Propietario, (propietario) => propietario.administradores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propietario_id' })
  propietario: Propietario;

  @Column({ name: 'propietario_id' })
  propietarioId: number;

  @Column({ type: 'varchar', unique: true })
  usuario: string;

  @Column({ type: 'varchar' })
  contrasena: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', default: RolAdministrador.EMPLEADO })
  rol: RolAdministrador;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
