import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('Немає токену');
      }
      
      const userPayload = await this.authService.verifyToken(token); 
      if (!userPayload) {
        throw new Error('Недійсний токен');
      }

      client.join(userPayload.sub); 
      
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
  }

  sendNotificationToUser(userId: string, payload: any) {
    const room = this.server.sockets.adapter.rooms.get(userId);
    this.server.to(userId).emit('new_notification', payload);
  }
}