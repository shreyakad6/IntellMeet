import { Request, Response, NextFunction } from 'express';
import { getCache } from '../config/redis.js';

/**
 * Basic IP rate limiter supported by Redis or In-Memory Cache
 */
export const rateLimiter = (options: { maxRequests: number; windowSeconds: number }) => {
  const { maxRequests, windowSeconds } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `ratelimit:${ip}:${req.path}`;
      const cache = getCache();

      const current = await cache.get(key);
      const requestCount = current ? parseInt(current, 10) : 0;

      if (requestCount >= maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please slow down and try again later.'
        });
        return;
      }

      await cache.set(key, (requestCount + 1).toString(), windowSeconds);
      next();
    } catch {
      // Don't fail requests if rate limiting encounters an error
      next();
    }
  };
};
