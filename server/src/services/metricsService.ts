import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'intellmeet-server'
});

// Enable the collection of default metrics (CPU, Memory, Event Loop, etc.)
client.collectDefaultMetrics({ register });

// Custom Application Metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests made',
  labelNames: ['method', 'route', 'status_code']
});

export const activeMeetingsGauge = new client.Gauge({
  name: 'intellmeet_active_meetings',
  help: 'Number of currently active meetings'
});

export const connectedSocketsGauge = new client.Gauge({
  name: 'intellmeet_connected_sockets',
  help: 'Number of currently connected Socket.io clients'
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeMeetingsGauge);
register.registerMetric(connectedSocketsGauge);

/**
 * Middleware to measure HTTP request duration and count
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    // Construct parameterized route to avoid high-cardinality labels
    let route = req.route ? `${req.baseUrl || ''}${req.route.path}` : (req.baseUrl || req.path);
    // Replace MongoDB ObjectIds and meeting codes in unmapped routes to prevent label explosion
    route = route.replace(/[0-9a-fA-F]{24}/g, ':id').replace(/[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}/g, ':code');

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString()
    });

    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode.toString()
      },
      durationInSeconds
    );
  });

  next();
};

/**
 * Endpoint handler for /metrics
 */
export const metricsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
};
