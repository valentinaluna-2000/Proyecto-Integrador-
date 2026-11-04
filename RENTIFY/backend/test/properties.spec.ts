import { PropertiesService } from '../src/properties/properties.service';
import { ImagenPropiedad, Propiedad } from '../src/persistence/entities';

describe('Listado de propiedades', () => {
  test('resuelve la portada en la consulta principal y no ejecuta una consulta por propiedad', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndMapMany: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1, imagenes: [{ url: 'cover.jpg' }] }]),
    };
    const imageRepository = { find: jest.fn() };
    const db = {
      getRepository: (entity: unknown) =>
        entity === Propiedad ? { createQueryBuilder: () => query } : imageRepository,
    };
    const service = new PropertiesService(db as any, {} as any);

    await expect(service.list({})).resolves.toEqual([{ id: 1, imagenes: [{ url: 'cover.jpg' }] }]);
    expect(query.leftJoinAndMapMany).toHaveBeenCalledWith(
      'p.imagenes',
      ImagenPropiedad,
      'image',
      expect.stringContaining('ORDER BY i.orden ASC'),
    );
    expect(imageRepository.find).not.toHaveBeenCalled();
  });
});
