import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import classRoutes from './routes/class.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import financeRoutes from './routes/finance.routes';
import gradingRoutes from './routes/grading.routes';
import portalRoutes from './routes/portal.routes';
import settingsRoutes from './routes/settings.routes';
import studentRoutes from './routes/student.routes';
import teacherPortalRoutes from './routes/teacher-portal.routes';
import teacherRoutes from './routes/teacher.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ================= ROUTES =================
app.use('/api/auth', authRoutes); // <--- ADD THIS
// The URL will look like: http://localhost:5000/api/auth/login

app.get('/', (req, res) => {
  res.send('School Management System API is running (v1.0)');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
});

app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/teacher-portal', teacherPortalRoutes);
app.use('/api/settings', settingsRoutes);