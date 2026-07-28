import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('subscribe:maintenance', () => {
      socket.join('maintenance');
    });

    socket.on('unsubscribe:maintenance', () => {
      socket.leave('maintenance');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocketIO first.');
  }
  return io;
}

export function emitMaintenanceUpdate(data: {
  enabled: boolean;
  type: 'marquee' | 'fullscreen';
  message: string;
}): void {
  if (io) {
    io.to('maintenance').emit('maintenance:update', data);
    // Also broadcast to all connected clients
    io.emit('maintenance:update', data);
  }
}
