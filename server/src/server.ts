import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { initSocketServer } from './socket/socketManager.js';
import { config } from './config/env.js';

const startServer = async () => {
  try {
    // 1. Initialize Express App
    const app = createApp();

    // 2. Create HTTP Server
    const httpServer = http.createServer(app);

    // 3. Initialize Socket.io Server for WebRTC signaling, Chat, and Real-time events
    initSocketServer(httpServer);

    // 4. Start HTTP Server first so platform port binding & health probes succeed immediately
    httpServer.listen(config.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 IntellMeet Server running in ${config.NODE_ENV} mode`);
      console.log(`📡 Listening on http://localhost:${config.PORT}`);
      console.log(`🔌 WebRTC Signaling & Socket.io ready`);
      console.log(`📊 Prometheus metrics at http://localhost:${config.PORT}/metrics`);
      console.log(`🩺 Health check at http://localhost:${config.PORT}/health`);
      console.log(`🤖 AI Status: ${config.DEMO_MODE ? 'Resilient Local Fallback Active' : 'Production AI Model Connected'}`);
      console.log('====================================================');
    });

    // 5. Connect to MongoDB (with retry handling)
    connectDB().catch((err) => {
      console.error('[Server] Initial MongoDB connection error (will retry):', err.message);
    });

    // 6. Initialize Cache layer (Redis or in-memory fallback)
    initRedis().catch((err) => {
      console.warn('[Server] Redis initialization note:', err.message);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log('[Server] HTTP and Socket server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Critical failure during startup:', error);
    process.exit(1);
  }
};

startServer();
