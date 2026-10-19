import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/env.js';
import { getDbStatus } from './config/db.js';
import { isRedisActive } from './config/redis.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { metricsMiddleware, metricsHandler } from './services/metricsService.js';
import { StorageService } from './services/storageService.js';

export const createApp = (): express.Application => {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for dev flexibility with WebRTC/video streams
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: [config.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Metrics collection middleware
  if (config.PROMETHEUS_METRICS_ENABLED) {
    app.use(metricsMiddleware);
  }

  // Serve static files (uploads / recordings / avatars)
  app.use('/uploads', express.static(StorageService.getUploadDir()));

  // Health and Readiness Check Endpoints
  app.get('/health', (req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        cache: isRedisActive() ? 'redis' : 'in-memory-fallback',
        aiService: config.DEMO_MODE ? 'demo-mode' : 'openai-configured'
      }
    });
  });

  app.get('/ready', (req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    if (dbStatus.connected) {
      res.status(200).json({ status: 'READY' });
    } else {
      res.status(503).json({ status: 'NOT_READY', reason: 'Database disconnected' });
    }
  });

  // Prometheus Metrics endpoint
  if (config.PROMETHEUS_METRICS_ENABLED) {
    app.get('/metrics', metricsHandler);
  }

  // Mount API Endpoints
  app.use('/api', apiRoutes);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
