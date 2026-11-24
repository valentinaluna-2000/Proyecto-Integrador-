import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutBeforeCheckin1782000000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
ALTER TABLE propiedades DROP CONSTRAINT IF EXISTS propiedad_horarios_validos;
ALTER TABLE propiedades ADD CONSTRAINT propiedad_horarios_validos
  CHECK (hora_checkout < hora_checkin) NOT VALID;
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reserva_fechas;
ALTER TABLE reservas ADD CONSTRAINT reserva_fechas
  CHECK (fecha_hasta >= fecha_desde + 1) NOT VALID;
`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`
ALTER TABLE propiedades DROP CONSTRAINT IF EXISTS propiedad_horarios_validos;
ALTER TABLE propiedades ADD CONSTRAINT propiedad_horarios_validos
  CHECK (hora_checkout >= hora_checkin OR (hora_checkin >= TIME '12:00' AND hora_checkout < TIME '12:00')) NOT VALID;
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reserva_fechas;
ALTER TABLE reservas ADD CONSTRAINT reserva_fechas CHECK (fecha_desde < fecha_hasta) NOT VALID;
`);
  }
}
