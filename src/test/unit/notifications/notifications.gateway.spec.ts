import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { Logger } from '@nestjs/common';

describe('NotificationsGateway', () => {
  const authService = { verifyToken: jest.fn() };
  const gateway = new NotificationsGateway(authService as any);
  const serverToMock = { to: jest.fn().mockReturnThis(), emit: jest.fn(), sockets: { adapter: { rooms: new Map() } } } as any;
  // @ts-ignore
  gateway.server = serverToMock;
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

  const makeClient = () => {
    const clientId = 'sock1';
    const rooms = new Set<string>();
    return {
      id: clientId,
      handshake: { auth: { token: 'T' } },
      join: (room: string) => rooms.add(room),
      // для контролю кімнат можна повертати rooms
      __rooms: rooms
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
    client.disconnect = jest.fn();
    await gateway.handleConnection(client);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('sendNotificationToUser -> emit у кімнату', () => {
    gateway.sendNotificationToUser('u1', { msg: 'hi' });
    expect(serverToMock.to).toHaveBeenCalledWith('u1');
    expect(serverToMock.emit).toHaveBeenCalledWith('new_notification', { msg: 'hi' });
  });
});
