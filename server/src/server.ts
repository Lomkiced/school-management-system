// FILE: server/src/server.ts
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
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
import portalRoutes from './routes/portal.routes';
import settingsRoutes from './routes/settings.routes';
import studentRoutes from './routes/student.routes';
import teacherPortalRoutes from './routes/teacher-portal.routes';
import teacherRoutes from './routes/teacher.routes';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Must match frontend URL exactly
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // <--- CRITICAL: Parses cookies

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/teacher-portal', teacherPortalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 SERVER RUNNING on http://localhost:${PORT}`);
});