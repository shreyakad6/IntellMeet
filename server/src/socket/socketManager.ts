import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env.js';
import { setupWebRtcHandlers } from './webrtcHandler.js';
import { setupChatHandlers } from './chatHandler.js';
import { setupTaskHandlers } from './taskHandler.js';
import { connectedSocketsGauge } from '../services/metricsService.js';

let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket: Socket) => {
    connectedSocketsGauge.inc();
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Register domain-specific handlers
    setupWebRtcHandlers(io!, socket);
    setupChatHandlers(io!, socket);
    setupTaskHandlers(io!, socket);

    socket.on('disconnect', () => {
      connectedSocketsGauge.dec();
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getSocketServer = (): Server | null => io;
