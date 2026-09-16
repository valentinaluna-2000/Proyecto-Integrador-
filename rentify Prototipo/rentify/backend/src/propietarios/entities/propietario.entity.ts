import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Administrador } from '../../administradores/entities/administrador.entity';
import { Property } from '../../properties/entities/property.entity';

export enum TipoTitular {
  PERSONA_FISICA = 'persona_fisica',
  EMPRESA = 'empresa',
}

/**
 * Representa al titular del sistema (persona fisica o juridica) que
 * administra un conjunto de propiedades. Un Propietario puede dar acceso
 * a varios usuarios "Administrador" (empleados) segun el DER oficial del
 * proyecto (rentify_der_ULTIMA_VERSION.puml).
 */
@Entity('propietarios')
export class Propietario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', name: 'tipo_titular', default: TipoTitular.PERSONA_FISICA })
  tipoTitular: TipoTitular;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar', unique: true })
  documento: string;

  @Column({ type: 'varchar', nullable: true })
  direccion: string;

  @Column({ type: 'varchar', nullable: true })
  telefono: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @OneToMany(() => Administrador, (administrador) => administrador.propietario)
  administradores: Administrador[];

  @OneToMany(() => Property, (property) => property.propietario)
  propiedades: Property[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
