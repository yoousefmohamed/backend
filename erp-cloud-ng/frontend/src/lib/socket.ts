import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'}/realtime`, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinCompanyRoom(companyId: string) {
  getSocket().emit('join-company', companyId);
}
