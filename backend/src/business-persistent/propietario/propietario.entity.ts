import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PropiedadEntity } from '../propiedad/propiedad.entity';
import { AdministradorEntity } from '../administrador/administrador.entity';

@Entity({ name: 'propietario' })
export class PropietarioEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'tipo_titular', type: 'varchar' }) tipoTitular: string;
  @Column({ type: 'varchar' }) nombre: string;
  @Column({ type: 'varchar' }) documento: string;
  @Column({ type: 'varchar' }) direccion: string;
  @Column({ type: 'varchar' }) telefono: string;
  @Column({ type: 'varchar' }) email: string;
  @OneToMany(() => PropiedadEntity, (p) => p.propietario) propiedades: PropiedadEntity[];
  @OneToMany(() => AdministradorEntity, (a) => a.propietario) administradores: AdministradorEntity[];
}
