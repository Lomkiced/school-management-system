// FILE: client/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return this.socket;

    // Connect to the same host as the API
    // If you are developing locally, it's usually http://localhost:5000
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'], // Force WebSocket for speed
      auth: {
        token: localStorage.getItem('token') // Send JWT for security
      }
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket Connected:', this.socket?.id);
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) return this.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();