import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http'; // Import HTTP module
import path from 'path';
import { Server } from 'socket.io'; // Import Socket.io

// Import Routes
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import classRoutes from './routes/class.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import financeRoutes from './routes/finance.routes';
import gradingRoutes from './routes/grading.routes';
import lmsRoutes from './routes/lms.routes'; // <--- NEW IMPORT
import portalRoutes from './routes/portal.routes';
import settingsRoutes from './routes/settings.routes';
import studentRoutes from './routes/student.routes';
import teacherPortalRoutes from './routes/teacher-portal.routes';
import teacherRoutes from './routes/teacher.routes';

dotenv.config();

const app = express();
const httpServer = http.createServer(app); // Wrap express app

// Initialize Socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Vite default
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve uploaded files statically (Make them accessible via URL)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/teacher-portal', teacherPortalRoutes);
app.use('/api/lms', lmsRoutes); // <--- REGISTER LMS ROUTES

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join a specific room (e.g., "class_101" or "student_123")
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Change app.listen to httpServer.listen
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready for real-time connections`);
});