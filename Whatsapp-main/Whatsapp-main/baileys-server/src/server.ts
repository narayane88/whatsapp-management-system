import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger.js';
import { ApiResponse } from './types.js';

// Import routes
import accountsRouter from './routes/accounts.js';
import messagesRouter from './routes/messages.js';
import statusRouter from './routes/status.js';
import contactsRouter from './routes/contacts.js';

const app = express();
const PORT = process.env.PORT || 3005;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  });
  next();
});

// Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/accounts', messagesRouter); // Messages are nested under accounts
app.use('/api/accounts', contactsRouter); // Contacts are nested under accounts
app.use('/api', statusRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'Baileys WhatsApp Server',
      version: '1.0.0',
      description: 'Standalone server for managing multiple WhatsApp accounts using Baileys',
      endpoints: {
        accounts: {
          'POST /api/accounts/connect': 'Connect new WhatsApp account',
          'DELETE /api/accounts/:id/disconnect': 'Disconnect account',
          'GET /api/accounts/:id/status': 'Get account status',
          'GET /api/accounts/:id/qr': 'Get QR code',
          'GET /api/accounts': 'List all accounts'
        },
        messages: {
          'POST /api/accounts/:id/send-message': 'Send message',
          'GET /api/accounts/:id/chats': 'Get chats (not implemented)'
        },
        contacts: {
          'GET /api/accounts/:id/contacts': 'Get all contacts',
          'GET /api/accounts/:id/contacts/:phoneNumber': 'Get specific contact info'
        },
        status: {
          'GET /api/health': 'Server health check',
          'GET /api/stats': 'Server statistics'
        }
      }
    },
    message: 'Baileys WhatsApp Server is running'
  } as ApiResponse);
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} does not exist`
  } as ApiResponse);
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  } as ApiResponse);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Baileys WhatsApp Server started on port ${PORT}`);
  logger.info(`📱 Ready to manage WhatsApp accounts`);
  logger.info(`🔗 API documentation available at http://localhost:${PORT}/`);
});

export default app;