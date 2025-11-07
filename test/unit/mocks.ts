import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';

export type PrismaMock = DeepMockProxy<PrismaService>;
export const createPrismaMock = (): PrismaMock => mockDeep<PrismaService>();
export const createJwtMock = () => mockDeep<JwtService>();
