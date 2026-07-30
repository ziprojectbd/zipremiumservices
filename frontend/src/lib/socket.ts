import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

type MaintenanceListener = (data: {
  enabled: boolean;
  type: 'marquee' | 'fullscreen';
  message: string;
}) => void;

const listeners = new Set<MaintenanceListener>();

export function getSocket(): Socket {
  if (!socket) {
    const url = import.meta.env.VITE_API_URL || '';
    // Strip /api suffix so socket connects to server root with default namespace.
    // Socket.IO interprets URL pathname as namespace, and the server has no /api namespace.
    // When VITE_API_URL is empty (production), undefined = same origin (current page host).
    const baseUrl = url ? url.replace(/\/api\/?$/, '') : undefined;
    socket = io(baseUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
      socket?.emit('subscribe:maintenance');
    });

    socket.on('maintenance:update', (data: { enabled: boolean; type: 'marquee' | 'fullscreen'; message: string }) => {
      console.log('[Socket] Maintenance update:', data);
      listeners.forEach((fn) => fn(data));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeMaintenance(fn: MaintenanceListener): () => void {
  listeners.add(fn);
  // Also get socket connected if not already
  getSocket();
  return () => {
    listeners.delete(fn);
  };
}

export function emitMaintenanceUpdate(data: {
  enabled: boolean;
  type: 'marquee' | 'fullscreen';
  message: string;
}): void {
  if (socket?.connected) {
    socket.emit('maintenance:update', data);
    socket.emit('maintenance:change', data);
  }
}
