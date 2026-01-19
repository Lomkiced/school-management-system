// FILE: server/src/server.ts
// 2026 Standard: Production-ready Express server with comprehensive middleware

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';

// Load environment variables first
dotenv.config();

// Import Middleware
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { apiRateLimiter, authRateLimiter } from './middlewares/rate-limit.middleware';
import { initSocket } from './lib/socket';

// Import Routes
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import classRoutes from './routes/class.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import financeRoutes from './routes/finance.routes';
import gradingRoutes from './routes/grading.routes';
import lmsRoutes from './routes/lms.routes';
import parentRoutes from './routes/parent.routes';
import parentPortalRoutes from './routes/parent-portal.routes';
import portalRoutes from './routes/portal.routes';
import settingsRoutes from './routes/settings.routes';
import studentRoutes from './routes/student.routes';
import teacherPortalRoutes from './routes/teacher-portal.routes';
import teacherRoutes from './routes/teacher.routes';

// ================= CONFIGURATION =================

const app = express();
const httpServer = http.createServer(app);

// Environment-based configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [CLIENT_URL];

// ================= SOCKET.IO =================

const io = initSocket(httpServer);

// ================= SECURITY MIDDLEWARE =================

// Helmet - Security headers (configure for development)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Time']
}));

// ================= PARSING MIDDLEWARE =================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ================= RATE LIMITING =================

// Apply general rate limiting to all API routes
app.use('/api', apiRateLimiter);

// ================= STATIC FILES =================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ================= REQUEST LOGGING (Development) =================

if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
      console.log(
        `${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.path} - ${duration}ms`
      );
    });
    next();
  });
}

// ================= HEALTH CHECK =================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// ================= API ROUTES =================

// Auth routes with stricter rate limiting
app.use('/api/auth', authRateLimiter, authRoutes);

// Core routes
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/grading', gradingRoutes);

// Feature routes
app.use('/api/lms', lmsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/teacher-portal', teacherPortalRoutes);
app.use('/api/parent-portal', parentPortalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// ================= ERROR HANDLING =================

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ================= SERVER STARTUP =================

httpServer.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 SERVER RUNNING`);
  console.log('='.repeat(50));
  console.log(`📍 URL:         http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 Client URL:  ${CLIENT_URL}`);
  console.log(`📅 Started:     ${new Date().toISOString()}`);
  console.log('='.repeat(50) + '\n');
});

// ================= GRACEFUL SHUTDOWN =================

const gracefulShutdown = (signal: string) => {
  console.log(`\n⚠️ Received ${signal}. Gracefully shutting down...`);

  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app, httpServer, io };