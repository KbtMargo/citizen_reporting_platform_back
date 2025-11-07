import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { Logger } from '@nestjs/common';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let authService: { verifyToken: jest.Mock };
  let emitSpy: jest.Mock;
  let serverMock: any;

  beforeEach(() => {
    authService = { verifyToken: jest.fn() };
    emitSpy = jest.fn();

    // Кожному тесту — свій server
    serverMock = {
      to: jest.fn(() => ({ emit: emitSpy })), // <<< ВАЖЛИВО: гарантуємо наявність emit
      sockets: { adapter: { rooms: new Map<string, Set<string>>() } },
    };

    gateway = new NotificationsGateway(authService as any);
    // @ts-ignore
    gateway.server = serverMock;

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  const makeClient = () => {
    const rooms = new Set<string>();
    return {
      id: 'sock1',
      handshake: { auth: { token: 'T' } },
      join: (room: string) => rooms.add(room),
      __rooms: rooms,
      disconnect: jest.fn(),
    } as any;
  };

  it('успішне підключення: валідний токен -> join(sub)', async () => {
    authService.verifyToken.mockResolvedValue({ sub: 'u1' });
    const client = makeClient();
    await gateway.handleConnection(client);
    expect(client.__rooms.has('u1')).toBe(true);
  });

  it('недійсний токен -> disconnect', async () => {
    authService.verifyToken.mockResolvedValue(null);
    const client = makeClient();
    await gateway.handleConnection(client);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('sendNotificationToUser -> emit у кімнату', () => {
    // на випадок якщо хтось десь перепише to()
    serverMock.to.mockImplementation(() => ({ emit: emitSpy }));

    gateway.sendNotificationToUser('u1', { msg: 'hi' });

    expect(serverMock.to).toHaveBeenCalledWith('u1');
    expect(emitSpy).toHaveBeenCalledWith('new_notification', { msg: 'hi' });
  });
});
