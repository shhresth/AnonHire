// Load environment variables FIRST, before any other imports read process.env
import './config/env';

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger, securityLogger } from './middleware/requestLogger';
import { logger, logAudit } from './utils/logger';
import routes from './routes';

const app: Application = express();
const PORT = process.env.PORT || 3001;
const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients and local frontend variants during development.
    if (
      !origin ||
      configuredOrigins.includes(origin) ||
      localhostPattern.test(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging middleware
app.use(securityLogger);
app.use(requestLogger);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1', routes);

// Public ZKP artifacts for client-side proof generation (wasm/zkey/vkey)
app.use('/api/v1/zkp-artifacts', express.static(path.join(__dirname, '../../zkp/build')));

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logAudit('Server Started', undefined, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
