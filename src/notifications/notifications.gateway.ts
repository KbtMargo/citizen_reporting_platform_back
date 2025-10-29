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

  private readonly logger = new Logger(NotificationsGateway.name);

  // Припустимо, ви інжектуєте AuthService для перевірки токену
  constructor(private readonly authService: AuthService) {}

  // Ця функція спрацює, коли користувач підключиться
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('Немає токену');
      }
      
      // Перевіряємо токен (логіка може бути вашою)
      const userPayload = await this.authService.verifyToken(token); // Вам треба мати такий метод
      if (!userPayload) {
        throw new Error('Недійсний токен');
      }

      // Кожен користувач приєднується до "кімнати" зі своїм ID
      // Це дозволяє нам надсилати сповіщення конкретному користувачу
      client.join(userPayload.sub); // userPayload.sub - це зазвичай userId
      this.logger.log(`Клієнт ${userPayload.sub} підключився: ${client.id}`);
      
    } catch (e) {
      this.logger.error(`Помилка підключення: ${e.message}`);
      client.disconnect();
    }
  }

  // Коли користувач відключився
  handleDisconnect(client: Socket) {
    this.logger.log(`Клієнт відключився: ${client.id}`);
  }

  // Цей метод ми будемо викликати з наших сервісів
  sendNotificationToUser(userId: string, payload: any) {
    this.server.to(userId).emit('new_notification', payload);
  }
}