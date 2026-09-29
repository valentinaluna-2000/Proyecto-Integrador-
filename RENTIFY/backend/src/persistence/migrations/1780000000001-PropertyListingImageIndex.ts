import { MigrationInterface, QueryRunner } from 'typeorm';

export class PropertyListingImageIndex1780000000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS imagenes_propiedad_cover_idx ON imagenes_propiedad(propiedad_id, orden, id)',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS imagenes_propiedad_cover_idx');
  }
}
