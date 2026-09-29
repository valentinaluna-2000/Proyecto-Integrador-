import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import Decimal from 'decimal.js';
import { Propiedad, ImagenPropiedad, PeriodoBloqueado } from '../persistence/entities';
import { Actor, dates, PropiedadEstado } from '../common/domain';
import { FiltersDto, PropertyDto, UpdatePropertyDto, BlockDto } from '../common/dtos';
import { ImageStorage, ILogicaPropiedades } from '../common/ports';
import {
  lockProperty,
  expireProperty,
  assertAvailable,
} from '../availability/availability.service';
export async function owned(tx: EntityManager, id: number, actor: Actor) {
  const p = await tx
    .getRepository(Propiedad)
    .findOneBy({ id, propietario_id: actor.propietario_id });
  if (!p) throw new NotFoundException('Propiedad no encontrada.');
  return p;
}
@Injectable()
export class PropertiesService implements ILogicaPropiedades {
  constructor(
    private db: DataSource,
    private storage: ImageStorage,
  ) {}
  async list(f: FiltersDto, actor?: Actor) {
    const q = this.db.getRepository(Propiedad).createQueryBuilder('p');
    if (actor) q.where('p.propietario_id=:owner', { owner: actor.propietario_id });
    else q.where('p.estado=:state', { state: PropiedadEstado.ACTIVA });
    if (f.ubicacion)
      q.andWhere('(p.direccion ILIKE :location OR p.nombre ILIKE :location)', {
        location: `%${f.ubicacion}%`,
      });
    if (f.capacidad) q.andWhere('p.capacidad>=:capacity', { capacity: f.capacidad });
    if (f.precio_min !== undefined) q.andWhere('p.precio_noche>=:min', { min: f.precio_min });
    if (f.precio_max !== undefined) q.andWhere('p.precio_noche<=:max', { max: f.precio_max });
    if (f.mascotas !== undefined)
      q.andWhere('p.acepta_mascotas=:pets', { pets: f.mascotas === 'true' });
    if (f.menores !== undefined)
      q.andWhere('p.acepta_menores=:kids', { kids: f.menores === 'true' });
    if (!!f.fecha_desde !== !!f.fecha_hasta) throw new BadRequestException('Ingresá ambas fechas.');
    if (f.fecha_desde && f.fecha_hasta) {
      dates(f.fecha_desde, f.fecha_hasta);
      q.andWhere(
        `NOT EXISTS(SELECT 1 FROM reservas r WHERE r.propiedad_id=p.id AND (r.estado='CONFIRMADA' OR (r.estado='TEMPORAL' AND r.fecha_vencimiento_temporal>now())) AND r.fecha_desde<:hasta AND r.fecha_hasta>:desde) AND NOT EXISTS(SELECT 1 FROM periodos_bloqueados b WHERE b.propiedad_id=p.id AND b.fecha_desde<:hasta AND b.fecha_hasta>:desde)`,
        { desde: f.fecha_desde, hasta: f.fecha_hasta },
      );
    }
    // A listing needs one cover image, not a gallery per property. Mapping the first image in
    // the main query prevents the previous 1 + N image queries while keeping detail unchanged.
    q.leftJoinAndMapMany(
      'p.imagenes',
      ImagenPropiedad,
      'image',
      `image.id = (SELECT i.id FROM imagenes_propiedad i WHERE i.propiedad_id=p.id ORDER BY i.orden ASC, i.id ASC LIMIT 1)`,
    );
    return q.orderBy('p.id', 'DESC').take(100).getMany();
  }
  async get(id: number, actor?: Actor) {
    const p = actor
      ? await owned(this.db.manager, id, actor)
      : await this.db.getRepository(Propiedad).findOneBy({ id, estado: PropiedadEstado.ACTIVA });
    if (!p) throw new NotFoundException('Propiedad no encontrada.');
    return {
      ...p,
      imagenes: await this.db
        .getRepository(ImagenPropiedad)
        .find({ where: { propiedad_id: id }, order: { orden: 'ASC' } }),
    };
  }
  private money(data: UpdatePropertyDto) {
    if (data.precio_noche !== undefined && new Decimal(data.precio_noche).lte(0))
      throw new BadRequestException('El precio debe ser mayor a cero.');
    if (
      data.porcentaje_sena !== undefined &&
      (new Decimal(data.porcentaje_sena).lte(0) || new Decimal(data.porcentaje_sena).gt(100))
    )
      throw new BadRequestException('La seña debe estar entre 0 y 100 por ciento.');
  }
  async create(actor: Actor, data: PropertyDto) {
    this.money(data);
    return this.db
      .getRepository(Propiedad)
      .save({
        ...data,
        latitud: String(data.latitud),
        longitud: String(data.longitud),
        propietario_id: actor.propietario_id!,
      });
  }
  async update(id: number, actor: Actor, data: UpdatePropertyDto) {
    this.money(data);
    return this.db.transaction(async (tx) => {
      await lockProperty(tx, id);
      const p = await owned(tx, id, actor);
      return tx.save(Propiedad, {
        ...p,
        ...data,
        latitud: String(data.latitud ?? p.latitud),
        longitud: String(data.longitud ?? p.longitud),
      });
    });
  }
  async image(id: number, actor: Actor, file: Express.Multer.File) {
    await owned(this.db.manager, id, actor);
    if (
      !file ||
      file.size > 5 * 1024 * 1024 ||
      !/^image\/(png|jpeg)$/.test(file.mimetype) ||
      !/\.(jpe?g|png)$/i.test(file.originalname)
    )
      throw new BadRequestException('Subí una imagen JPG o PNG de hasta 5 MB.');
    const png = file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = file.buffer[0] === 255 && file.buffer[1] === 216 && file.buffer[2] === 255;
    if ((file.mimetype === 'image/png' && !png) || (file.mimetype === 'image/jpeg' && !jpg))
      throw new BadRequestException('El contenido no corresponde a una imagen válida.');
    const result = await this.storage.upload(id, file);
    try {
      return await this.db
        .getRepository(ImagenPropiedad)
        .save({
          propiedad_id: id,
          url: result.url,
          storage_path: result.path,
          orden: await this.db.getRepository(ImagenPropiedad).countBy({ propiedad_id: id }),
        });
    } catch (e) {
      await this.storage.remove(result.path);
      throw e;
    }
  }
  async removeImage(id: number, imageId: number, actor: Actor) {
    await owned(this.db.manager, id, actor);
    const image = await this.db
      .getRepository(ImagenPropiedad)
      .findOneBy({ id: imageId, propiedad_id: id });
    if (!image) throw new NotFoundException();
    if (image.storage_path) await this.storage.remove(image.storage_path);
    await this.db.getRepository(ImagenPropiedad).delete(image.id);
    return { message: 'Imagen eliminada.' };
  }
  async orderImage(id: number, imageId: number, actor: Actor, order: number) {
    await owned(this.db.manager, id, actor);
    await this.db
      .getRepository(ImagenPropiedad)
      .update({ id: imageId, propiedad_id: id }, { orden: order });
    return { message: 'Orden actualizado.' };
  }
  async blocks(id: number, actor: Actor) {
    await owned(this.db.manager, id, actor);
    return this.db
      .getRepository(PeriodoBloqueado)
      .find({ where: { propiedad_id: id }, order: { fecha_desde: 'ASC' } });
  }
  async block(id: number, actor: Actor, data: BlockDto, blockId?: number) {
    dates(data.fecha_desde, data.fecha_hasta);
    return this.db.transaction(async (tx) => {
      await lockProperty(tx, id);
      await owned(tx, id, actor);
      await expireProperty(tx, id);
      if (
        blockId &&
        !(await tx.getRepository(PeriodoBloqueado).existsBy({ id: blockId, propiedad_id: id }))
      )
        throw new NotFoundException();
      await assertAvailable(tx, id, data.fecha_desde, data.fecha_hasta, blockId);
      return tx.save(PeriodoBloqueado, {
        ...data,
        propiedad_id: id,
        ...(blockId ? { id: blockId } : {}),
      });
    });
  }
  async removeBlock(id: number, blockId: number, actor: Actor) {
    return this.db.transaction(async (tx) => {
      await lockProperty(tx, id);
      await owned(tx, id, actor);
      await tx.delete(PeriodoBloqueado, { id: blockId, propiedad_id: id });
      return { message: 'Período eliminado.' };
    });
  }
}
