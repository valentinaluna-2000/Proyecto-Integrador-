import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PropietarioEntity } from '../propietario/propietario.entity';
import { ImagenPropiedadEntity } from '../imagen-propiedad/imagen-propiedad.entity';
import { ReservaEntity } from '../reserva/reserva.entity';
import { PeriodoBloqueadoEntity } from '../periodo-bloqueado/periodo-bloqueado.entity';

@Entity({ name: 'propiedad' })
export class PropiedadEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'propietario_id' }) propietarioId: number;
  @ManyToOne(() => PropietarioEntity, (p) => p.propiedades) @JoinColumn({ name: 'propietario_id' }) propietario: PropietarioEntity;
  @Column({ type: 'varchar' }) nombre: string;
  @Column({ type: 'varchar' }) tipo: string;
  @Column({ type: 'text' }) descripcion: string;
  @Column({ type: 'varchar' }) direccion: string;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) latitud: string;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) longitud: string;
  @Column() capacidad: number;
  @Column({ name: 'cantidad_habitaciones' }) cantidadHabitaciones: number;
  @Column({ name: 'cantidad_banos' }) cantidadBanos: number;
  @Column({ name: 'hora_checkin', type: 'time' }) horaCheckin: string;
  @Column({ name: 'hora_checkout', type: 'time' }) horaCheckout: string;
  @Column({ name: 'acepta_mascotas' }) aceptaMascotas: boolean;
  @Column({ name: 'acepta_menores' }) aceptaMenores: boolean;
  @Column({ name: 'limite_meses_reserva' }) limiteMesesReserva: number;
  @Column({ name: 'precio_noche', type: 'decimal', precision: 12, scale: 2 }) precioNoche: string;
  @Column({ name: 'porcentaje_sena', type: 'decimal', precision: 5, scale: 2 }) porcentajeSena: string;
  @Column({ type: 'varchar' }) estado: string;
  @OneToMany(() => ImagenPropiedadEntity, (i) => i.propiedad) imagenes: ImagenPropiedadEntity[];
  @OneToMany(() => ReservaEntity, (r) => r.propiedad) reservas: ReservaEntity[];
  @OneToMany(() => PeriodoBloqueadoEntity, (b) => b.propiedad) periodosBloqueados: PeriodoBloqueadoEntity[];
}
