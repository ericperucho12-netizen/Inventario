import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // El cliente puede enviar su companyId al conectarse o unirse a un room
    const companyId = client.handshake.query.companyId;
    if (companyId) {
      client.join(`company_${companyId}`);
      console.log(`Client ${client.id} joined room company_${companyId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
  }

  // Método para emitir actualización de inventario a una empresa específica
  emitInventoryUpdate(companyId: string) {
    this.server.to(`company_${companyId}`).emit('inventory-updated', { timestamp: new Date() });
  }
}
