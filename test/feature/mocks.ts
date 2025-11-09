import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma.service';

export type PrismaMock = DeepMockProxy<PrismaService>;
export const createPrismaMock = (): PrismaMock => mockDeep<PrismaService>();
