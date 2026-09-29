import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('propietarios')
export class Propietario {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text', nullable: false }) tipo_titular!: string;
  @Column({ type: 'text', nullable: false }) nombre!: string;
  @Column({ type: 'text', nullable: false }) documento!: string;
  @Column({ type: 'text', nullable: false }) direccion!: string;
  @Column({ type: 'text', nullable: false }) telefono!: string;
  @Column({ type: 'text', nullable: false }) email!: string;
}
@Entity('administradores')
export class Administrador {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'integer', nullable: false }) propietario_id!: number;
  @Column({ type: 'uuid', nullable: false }) auth_user_id!: string;
  @Column({ type: 'text', nullable: false }) nombre!: string;
  @Column({ type: 'text', nullable: false }) apellido!: string;
  @Column({ type: 'text', nullable: false }) email!: string;
  @Column({ type: 'text', nullable: false }) rol!: string;
}
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'uuid', nullable: false }) auth_user_id!: string;
  @Column({ type: 'text', nullable: false }) nombre!: string;
  @Column({ type: 'text', nullable: false }) apellido!: string;
  @Column({ type: 'text', nullable: false }) documento!: string;
  @Column({ type: 'text', nullable: false }) email!: string;
  @Column({ type: 'text', nullable: false }) telefono!: string;
  @Column({ type: 'date', nullable: false }) fecha_nacimiento!: string;
}
@Entity('propiedades')
export class Propiedad {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'integer', nullable: false }) propietario_id!: number;
  @Column({ type: 'text', nullable: false }) nombre!: string;
  @Column({ type: 'text', nullable: false }) tipo!: string;
  @Column({ type: 'text', nullable: false }) descripcion!: string;
  @Column({ type: 'text', nullable: false }) direccion!: string;
  @Column({ type: 'numeric', nullable: false }) latitud!: string;
  @Column({ type: 'numeric', nullable: false }) longitud!: string;
  @Column({ type: 'integer', nullable: false }) capacidad!: number;
  @Column({ type: 'integer', nullable: false }) cantidad_habitaciones!: number;
  @Column({ type: 'integer', nullable: false }) cantidad_banos!: number;
  @Column({ type: 'time', nullable: false }) hora_checkin!: string;
  @Column({ type: 'time', nullable: false }) hora_checkout!: string;
  @Column({ type: 'boolean', nullable: false }) acepta_mascotas!: boolean;
  @Column({ type: 'boolean', nullable: false }) acepta_menores!: boolean;
  @Column({ type: 'integer', nullable: false }) limite_meses_reserva!: number;
  @Column({ type: 'numeric', nullable: false }) precio_noche!: string;
  @Column({ type: 'numeric', nullable: false }) porcentaje_sena!: string;
  @Column({ type: 'text', nullable: false }) estado!: string;
}
@Entity('imagenes_propiedad')
export class ImagenPropiedad {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'integer', nullable: false }) propiedad_id!: number;
  @Column({ type: 'text', nullable: false }) url!: string;
  @Column({ type: 'integer', nullable: false }) orden!: number;
  @Column({ type: 'text', nullable: true }) storage_path!: string | null;
}
@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'integer', nullable: false }) propiedad_id!: number;
  @Column({ type: 'integer', nullable: false }) cliente_id!: number;
  @Column({ type: 'date', nullable: false }) fecha_desde!: string;
  @Column({ type: 'date', nullable: false }) fecha_hasta!: string;
  @Column({ type: 'timestamptz', nullable: false }) fecha_creacion!: Date;
  @Column({ type: 'timestamptz', nullable: false }) fecha_vencimiento_temporal!: Date;
  @Column({ type: 'integer', nullable: false }) cantidad_huespedes!: number;
  @Column({ type: 'text', nullable: false }) estado!: string;
  @Column({ type: 'numeric', nullable: false }) importe_total!: string;
  @Column({ type: 'numeric', nullable: false }) importe_sena!: string;
}
@Entity('periodos_bloqueados')
export class PeriodoBloqueado {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'integer', nullable: false }) propiedad_id!: number;
  @Column({ type: 'date', nullable: false }) fecha_desde!: string;
  @Column({ type: 'date', nullable: false }) fecha_hasta!: string;
  @Column({ type: 'text', nullable: false }) motivo!: string;
}
@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'integer', nullable: false }) reserva_id!: number;
  @Column({ type: 'numeric', nullable: false }) monto!: string;
  @Column({ type: 'timestamptz', nullable: false }) fecha!: Date;
  @Column({ type: 'text', nullable: false }) estado!: string;
  @Column({ type: 'text', nullable: false }) id_transaccion_externa!: string;
}
@Entity('cancelaciones')
export class Cancelacion {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'integer', nullable: false }) reserva_id!: number;
  @Column({ type: 'integer', nullable: true }) administrador_id!: number | null;
  @Column({ type: 'integer', nullable: true }) cliente_id!: number | null;
  @Column({ type: 'text', nullable: false }) tipo_usuario!: string;
  @Column({ type: 'timestamptz', nullable: false }) fecha!: Date;
  @Column({ type: 'text', nullable: false }) motivo!: string;
  @Column({ type: 'boolean', nullable: false }) es_excepcional!: boolean;
  @Column({ type: 'boolean', nullable: false }) requiere_reintegro!: boolean;
}
@Entity('email_outbox')
export class Outbox {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'uuid', nullable: false }) event_id!: string;
  @Column({ type: 'text', nullable: false }) topic!: string;
  @Column({ type: 'jsonb', nullable: false }) payload!: Record<string, unknown>;
  @Column({ type: 'timestamptz', nullable: false }) created_at!: Date;
  @Column({ type: 'timestamptz', nullable: true }) published_at!: Date | null;
}
@Entity('email_receipts')
export class EmailReceipt {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'uuid', nullable: false }) event_id!: string;
  @Column({ type: 'timestamptz', nullable: false }) sent_at!: Date;
}
