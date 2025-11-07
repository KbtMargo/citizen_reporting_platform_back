import { AuthService } from 'src/auth/auth.service';
import { createPrismaMock, createJwtMock } from '../mocks';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = createPrismaMock();
  const jwt = createJwtMock();

  beforeEach(() => {
    service = new AuthService(prisma as any, jwt as any);
    // Вимкнемо реальний reCAPTCHA/Google всередині тестів (можна винести в окремі порти)
    // @ts-ignore
    service['verifyRecaptcha'] = jest.fn().mockResolvedValue(undefined);
    // @ts-ignore
    service['googleClient'] = { verifyIdToken: jest.fn() };
  });

  it('verifyToken -> валідний токен', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'a@a', role: 'RESIDENT' });
    await expect(service.verifyToken('token')).resolves.toEqual({ sub: 'u1', email: 'a@a', role: 'RESIDENT' });
  });

  it('verifyToken -> невалідний токен', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid'));
    await expect(service.verifyToken('bad')).resolves.toBeNull();
  });

  it('login -> 401 якщо юзера нема', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('x@x', 'p')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login -> 401 якщо google_user', async () => {
    prisma.user.findUnique.mockResolvedValue({ password: 'google_user_123', email: 'x@x' } as any);
    await expect(service.login('x@x','p')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('register -> 409 якщо email існує', async () => {
    prisma.oSBB.findUnique.mockResolvedValue({ id: 'osbb1' } as any);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
    await expect(
      service.register('a@a','p','f','l','CODE',undefined,'rec')
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register -> 400 якщо код ОСББ невалідний', async () => {
    prisma.oSBB.findUnique.mockResolvedValue(null);
    await expect(
      service.register('a@a','p','f','l','BAD',undefined,'rec')
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
