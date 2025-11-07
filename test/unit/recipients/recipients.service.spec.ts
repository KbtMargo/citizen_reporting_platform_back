import { RecipientsService } from 'src/recipients/recipients.service';
import { createPrismaMock, PrismaMock } from '../mocks';

describe('RecipientsService (unit)', () => {
  let service: RecipientsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    // @ts-ignore
    service = new RecipientsService(prisma);
  });

  it('findAll -> читає всіх отримувачів', async () => {
    prisma.recipient.findMany.mockResolvedValue([
      { id: 'r1', name: 'Міськсвітло' },
      { id: 'r2', name: 'Дорсервіс' },
    ] as any);

    const res = await service.findAll();

    expect(prisma.recipient.findMany).toHaveBeenCalledTimes(1);
    expect(res).toHaveLength(2);
    expect(res[1].name).toBe('Дорсервіс');
  });
});
