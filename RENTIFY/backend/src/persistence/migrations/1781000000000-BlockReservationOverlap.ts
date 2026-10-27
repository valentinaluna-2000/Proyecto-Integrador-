import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlockReservationOverlap1781000000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
ALTER TABLE propiedades
  ADD CONSTRAINT propiedad_horarios_validos CHECK (
    hora_checkout >= hora_checkin OR (hora_checkin >= TIME '12:00' AND hora_checkout < TIME '12:00')
  ) NOT VALID;

CREATE FUNCTION reject_reservation_block_overlap() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM periodos_bloqueados b
    WHERE b.propiedad_id = NEW.propiedad_id
      AND daterange(b.fecha_desde, b.fecha_hasta, '[)')
          && daterange(NEW.fecha_desde, NEW.fecha_hasta, '[)')
  ) THEN
    RAISE EXCEPTION 'reservation overlaps a blocked period'
      USING ERRCODE = '23P01', CONSTRAINT = 'reserva_no_superpone_bloqueo';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION reject_block_reservation_overlap() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservas r
    WHERE r.propiedad_id = NEW.propiedad_id
      AND r.estado IN ('TEMPORAL', 'CONFIRMADA')
      AND daterange(r.fecha_desde, r.fecha_hasta, '[)')
          && daterange(NEW.fecha_desde, NEW.fecha_hasta, '[)')
  ) THEN
    RAISE EXCEPTION 'blocked period overlaps an active reservation'
      USING ERRCODE = '23P01', CONSTRAINT = 'bloqueo_no_superpone_reserva';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reservas_sin_bloqueos
  BEFORE INSERT OR UPDATE OF propiedad_id, fecha_desde, fecha_hasta, estado ON reservas
  FOR EACH ROW WHEN (NEW.estado IN ('TEMPORAL', 'CONFIRMADA'))
  EXECUTE FUNCTION reject_reservation_block_overlap();

CREATE TRIGGER bloqueos_sin_reservas
  BEFORE INSERT OR UPDATE OF propiedad_id, fecha_desde, fecha_hasta ON periodos_bloqueados
  FOR EACH ROW
  EXECUTE FUNCTION reject_block_reservation_overlap();
`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`
DROP TRIGGER IF EXISTS bloqueos_sin_reservas ON periodos_bloqueados;
DROP TRIGGER IF EXISTS reservas_sin_bloqueos ON reservas;
DROP FUNCTION IF EXISTS reject_block_reservation_overlap();
DROP FUNCTION IF EXISTS reject_reservation_block_overlap();
ALTER TABLE propiedades DROP CONSTRAINT IF EXISTS propiedad_horarios_validos;
`);
  }
}
