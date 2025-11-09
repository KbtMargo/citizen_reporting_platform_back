import { CategoriesService } from 'src/categories/categories.service';
import { createPrismaMock, PrismaMock } from '../mocks';

describe('CategoriesService (unit)', () => {
  let service: CategoriesService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    // @ts-ignore
    service = new CategoriesService(prisma);
  });

  it('findAll -> повертає список категорій', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 'c1', name: 'Дороги' },
      { id: 'c2', name: 'Освітлення' },
    ] as any);

    const res = await service.findAll();

    expect(prisma.category.findMany).toHaveBeenCalledTimes(1);
    expect(res).toHaveLength(2);
    expect(res[0].name).toBe('Дороги');
  });
});
