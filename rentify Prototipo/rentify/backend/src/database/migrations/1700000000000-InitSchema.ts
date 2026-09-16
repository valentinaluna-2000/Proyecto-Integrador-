import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);

    await queryRunner.query(`
      CREATE TABLE "propietarios" (
        "id" SERIAL PRIMARY KEY,
        "tipo_titular" varchar NOT NULL DEFAULT 'persona_fisica',
        "nombre" varchar NOT NULL,
        "documento" varchar NOT NULL UNIQUE,
        "direccion" varchar,
        "telefono" varchar,
        "email" varchar NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "administradores" (
        "id" SERIAL PRIMARY KEY,
        "propietario_id" int NOT NULL REFERENCES "propietarios"("id") ON DELETE CASCADE,
        "usuario" varchar NOT NULL UNIQUE,
        "contrasena" varchar NOT NULL,
        "email" varchar NOT NULL UNIQUE,
        "rol" varchar NOT NULL DEFAULT 'empleado',
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "clientes" (
        "id" SERIAL PRIMARY KEY,
        "nombre" varchar NOT NULL,
        "apellido" varchar NOT NULL,
        "email" varchar NOT NULL UNIQUE,
        "telefono" varchar,
        "contrasena" varchar NOT NULL,
        "fecha_nacimiento" date,
        "activo" boolean NOT NULL DEFAULT true,
        "reset_password_token" varchar,
        "reset_password_expires" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "propiedades" (
        "id" SERIAL PRIMARY KEY,
        "propietario_id" int NOT NULL REFERENCES "propietarios"("id") ON DELETE RESTRICT,
        "nombre" varchar NOT NULL,
        "descripcion" text,
        "tipo" varchar NOT NULL DEFAULT 'casa',
        "direccion" varchar NOT NULL,
        "ciudad" varchar,
        "latitud" numeric(10,6),
        "longitud" numeric(10,6),
        "capacidad" int NOT NULL,
        "hora_checkin" time NOT NULL DEFAULT '14:00:00',
        "hora_checkout" time NOT NULL DEFAULT '10:00:00',
        "acepta_mascotas" boolean NOT NULL DEFAULT false,
        "acepta_menores" boolean NOT NULL DEFAULT true,
        "limite_meses_reserva" int NOT NULL DEFAULT 6,
        "precio_noche" numeric(12,2) NOT NULL,
        "porcentaje_sena" numeric(5,2) NOT NULL DEFAULT 30,
        "estado" varchar NOT NULL DEFAULT 'activa',
        "politica_cancelacion" varchar NOT NULL DEFAULT 'estandar',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_propiedades_estado" ON "propiedades" ("estado");
    `);

    await queryRunner.query(`
      CREATE TABLE "imagenes_propiedad" (
        "id" SERIAL PRIMARY KEY,
        "property_id" int NOT NULL REFERENCES "propiedades"("id") ON DELETE CASCADE,
        "url" varchar NOT NULL,
        "original_name" varchar,
        "size" int,
        "orden" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_imagenes_property" ON "imagenes_propiedad" ("property_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "periodos_bloqueados" (
        "id" SERIAL PRIMARY KEY,
        "property_id" int NOT NULL REFERENCES "propiedades"("id") ON DELETE CASCADE,
        "fecha_desde" date NOT NULL,
        "fecha_hasta" date NOT NULL,
        "motivo" varchar NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_bloqueos_property_fechas" ON "periodos_bloqueados" ("property_id", "fecha_desde", "fecha_hasta");
    `);

    await queryRunner.query(`
      CREATE TABLE "reservas" (
        "id" SERIAL PRIMARY KEY,
        "property_id" int NOT NULL REFERENCES "propiedades"("id") ON DELETE RESTRICT,
        "cliente_id" int NOT NULL REFERENCES "clientes"("id") ON DELETE RESTRICT,
        "fecha_desde" date NOT NULL,
        "fecha_hasta" date NOT NULL,
        "noches" int NOT NULL,
        "precio_noche_snapshot" numeric(12,2) NOT NULL,
        "importe_total" numeric(12,2) NOT NULL,
        "importe_sena" numeric(12,2) NOT NULL,
        "estado" varchar NOT NULL DEFAULT 'PENDING_PAYMENT',
        "fecha_vencimiento_temporal" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "rango" daterange GENERATED ALWAYS AS (daterange("fecha_desde", "fecha_hasta", '[]')) STORED
      );
      CREATE INDEX "idx_reservas_property_fechas" ON "reservas" ("property_id", "fecha_desde", "fecha_hasta");
      CREATE INDEX "idx_reservas_cliente" ON "reservas" ("cliente_id");
      CREATE INDEX "idx_reservas_estado" ON "reservas" ("estado");
    `);

    // Barrera a nivel de base de datos (requisito no funcional "Control de
    // Concurrencia en Reservas"): impide fisicamente que existan dos
    // reservas activas (PENDING_PAYMENT vigente o CONFIRMED) que se
    // superpongan en fechas para la misma propiedad, incluso ante
    // condiciones de carrera extremas no cubiertas por el bloqueo de fila
    // a nivel de aplicacion.
    await queryRunner.query(`
      ALTER TABLE "reservas"
      ADD CONSTRAINT "no_overlapping_active_reservations"
      EXCLUDE USING gist (
        "property_id" WITH =,
        "rango" WITH &&
      )
      WHERE ("estado" IN ('PENDING_PAYMENT', 'CONFIRMED'));
    `);

    await queryRunner.query(`
      CREATE TABLE "pagos" (
        "id" SERIAL PRIMARY KEY,
        "reservation_id" int NOT NULL REFERENCES "reservas"("id") ON DELETE RESTRICT,
        "provider" varchar NOT NULL DEFAULT 'mercadopago',
        "external_payment_id" varchar,
        "external_preference_id" varchar,
        "monto" numeric(12,2) NOT NULL,
        "estado" varchar NOT NULL DEFAULT 'pending',
        "status_detail" varchar,
        "paid_at" timestamptz,
        "raw_payload" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_pagos_external_id" ON "pagos" ("external_payment_id");
      CREATE INDEX "idx_pagos_reservation" ON "pagos" ("reservation_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "cancelaciones" (
        "id" SERIAL PRIMARY KEY,
        "reservation_id" int NOT NULL UNIQUE REFERENCES "reservas"("id") ON DELETE CASCADE,
        "tipo_usuario" varchar NOT NULL,
        "usuario_id" int NOT NULL,
        "usuario_nombre" varchar NOT NULL,
        "fecha" timestamptz NOT NULL DEFAULT now(),
        "motivo" text NOT NULL,
        "es_excepcional" boolean NOT NULL DEFAULT false,
        "genero_reintegro" boolean NOT NULL DEFAULT false
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cancelaciones";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pagos";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reservas";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "periodos_bloqueados";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "imagenes_propiedad";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "propiedades";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clientes";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "administradores";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "propietarios";`);
  }
}
