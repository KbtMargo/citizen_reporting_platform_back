import { AuthService } from 'src/auth/auth.service';
import { createPrismaMock, createJwtMock } from '../mocks';

describe('AuthService.register (success path)', () => {
  let service: AuthService;
  const prisma = createPrismaMock();
  const jwt = createJwtMock();

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    service = new AuthService(prisma as any, jwt as any);
    // вимикаємо зовнішнє
    // @ts-ignore
    service['verifyRecaptcha'] = jest.fn().mockResolvedValue(undefined);
    // @ts-ignore
    service['googleClient'] = { verifyIdToken: jest.fn() };

    prisma.user.findUnique.mockResolvedValue(null);                  // email вільний
    prisma.oSBB.findUnique.mockResolvedValue({ id: 'osbb1' } as any); // код ОСББ валідний
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@a',
      password: 'hashed',
      firstName: 'First',
      lastName: 'Last',
      osbbId: 'osbb1',
    } as any);
  });

  it('створює юзера', async () => {
    const args = ['a@a','p','First','Last','CODE', undefined, 'recaptcha-token'] as const;

    const res = await service.register(...args);

    // ключ виправлено на invitationCode
    expect(prisma.oSBB.findUnique).toHaveBeenCalledWith({ where: { invitationCode: 'CODE' } });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@a' } });
    expect(prisma.user.create).toHaveBeenCalledTimes(1);

    // повертається користувач без пароля
    expect(res).toMatchObject({
      id: 'u1',
      email: 'a@a',
      firstName: 'First',
      lastName: 'Last',
      osbbId: 'osbb1',
    });
    expect((res as any).password).toBeUndefined();

  });
});
