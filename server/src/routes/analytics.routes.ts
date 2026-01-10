// FILE: server/src/routes/analytics.routes.ts
import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Global Protection
router.use(authenticate);

// Admin Route (Controller checks strict Role)
router.get('/admin', analyticsController.getAdminDashboard);

// Teacher Route
router.get('/teacher', analyticsController.getTeacherDashboard);

export default router;