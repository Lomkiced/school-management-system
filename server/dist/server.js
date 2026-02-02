"use strict";
// FILE: server/src/server.ts
// 2026 Standard: Production-ready Express server with comprehensive middleware
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
// Load environment variables first
dotenv_1.default.config();
// Import Middleware
const error_middleware_1 = require("./middlewares/error.middleware");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
const socket_1 = require("./lib/socket");
// Import Routes
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const grading_routes_1 = __importDefault(require("./routes/grading.routes"));
const lms_routes_1 = __importDefault(require("./routes/lms.routes"));
const parent_routes_1 = __importDefault(require("./routes/parent.routes"));
const parent_portal_routes_1 = __importDefault(require("./routes/parent-portal.routes"));
const portal_routes_1 = __importDefault(require("./routes/portal.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const teacher_portal_routes_1 = __importDefault(require("./routes/teacher-portal.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
// Automation Routes (Phase 1 Enhancement)
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
// Phase 2: Scheduling
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
// Phase 4: People Manager
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const promotion_routes_1 = __importDefault(require("./routes/promotion.routes"));
const grade_level_routes_1 = __importDefault(require("./routes/grade-level.routes")); // Added Route Import
// ================= CONFIGURATION =================
const app = (0, express_1.default)();
exports.app = app;
const httpServer = http_1.default.createServer(app);
exports.httpServer = httpServer;
// Environment-based configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [CLIENT_URL];
// ================= SOCKET.IO =================
const io = (0, socket_1.initSocket)(httpServer);
exports.io = io;
// ================= SECURITY MIDDLEWARE =================
// Helmet - Security headers (configure for development)
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));
// CORS - Cross-Origin Resource Sharing
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Time']
}));
// ================= PARSING MIDDLEWARE =================
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ================= RATE LIMITING =================
// Apply general rate limiting to all API routes
app.use('/api', rate_limit_middleware_1.apiRateLimiter);
// ================= STATIC FILES =================
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// ================= REQUEST LOGGING (Development) =================
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
            console.log(`${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.path} - ${duration}ms`);
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
app.use('/api/auth', rate_limit_middleware_1.authRateLimiter, auth_routes_1.default);
// Core routes
app.use('/api/students', student_routes_1.default);
app.use('/api/teachers', teacher_routes_1.default);
app.use('/api/parents', parent_routes_1.default);
app.use('/api/classes', class_routes_1.default);
app.use('/api/enrollments', enrollment_routes_1.default);
app.use('/api/finance', finance_routes_1.default);
app.use('/api/grading', grading_routes_1.default);
// Feature routes
app.use('/api/lms', lms_routes_1.default);
app.use('/api/portal', portal_routes_1.default);
app.use('/api/teacher-portal', teacher_portal_routes_1.default);
app.use('/api/parent-portal', parent_portal_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
// Automation routes (Phase 1 Enhancement)
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
// Phase 2: Scheduling
app.use('/api/schedule', schedule_routes_1.default);
// Phase 4: People Manager
app.use('/api/departments', department_routes_1.default);
app.use('/api/promotion', promotion_routes_1.default);
app.use('/api/grade-levels', grade_level_routes_1.default); // Added Route Use
// ================= ERROR HANDLING =================
// 404 handler for unmatched routes
app.use(error_middleware_1.notFoundHandler);
// Global error handler
app.use(error_middleware_1.errorHandler);
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
const gracefulShutdown = (signal) => {
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
