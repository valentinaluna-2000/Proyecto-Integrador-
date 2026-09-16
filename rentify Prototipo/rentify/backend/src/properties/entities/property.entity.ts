import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Propietario } from '../../propietarios/entities/propietario.entity';
import { PropertyImage } from '../../property-images/entities/property-image.entity';
import { BlockedPeriod } from '../../blocked-periods/entities/blocked-period.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum PropertyType {
  CASA = 'casa',
  CABANA = 'cabana',
  DEPARTAMENTO = 'departamento',
  QUINTA = 'quinta',
}

export enum PropertyStatus {
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
}

@Entity('propiedades')
@Index(['estado'])
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Propietario, (propietario) => propietario.propiedades, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'propietario_id' })
  propietario: Propietario;

  @Column({ name: 'propietario_id' })
  propietarioId: number;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', default: PropertyType.CASA })
  tipo: PropertyType;

  @Column({ type: 'varchar' })
  direccion: string;

  @Column({ type: 'varchar', nullable: true })
  ciudad: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitud: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitud: number;

  @Column({ type: 'int' })
  capacidad: number;

  @Column({ type: 'time', name: 'hora_checkin', default: '14:00:00' })
  horaCheckin: string;

  @Column({ type: 'time', name: 'hora_checkout', default: '10:00:00' })
  horaCheckout: string;

  @Column({ type: 'boolean', name: 'acepta_mascotas', default: false })
  aceptaMascotas: boolean;

  @Column({ type: 'boolean', name: 'acepta_menores', default: true })
  aceptaMenores: boolean;

  @Column({ type: 'int', name: 'limite_meses_reserva', default: 6 })
  limiteMesesReserva: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'precio_noche' })
  precioNoche: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'porcentaje_sena', default: 30 })
  porcentajeSena: number;

  @Column({
    type: 'varchar',
    default: PropertyStatus.ACTIVA,
  })
  @Index()
  estado: PropertyStatus;

  @Column({ type: 'varchar', name: 'politica_cancelacion', default: 'estandar' })
  politicaCancelacion: string;

  @OneToMany(() => PropertyImage, (image) => image.property, { cascade: true })
  imagenes: PropertyImage[];

  @OneToMany(() => BlockedPeriod, (period) => period.property)
  periodosBloqueados: BlockedPeriod[];

  @OneToMany(() => Reservation, (reservation) => reservation.property)
  reservas: Reservation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
