// FILE: server/src/routes/portal.routes.ts
// 2026 Standard: Student portal routes with comprehensive endpoints

import { Router } from 'express';
import * as portalController from '../controllers/portal.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// ==================== STUDENT PORTAL ====================

/**
 * GET /api/portal/grades
 * Get current student's grades
 */
router.get('/grades', restrictTo('STUDENT'), portalController.getMyGrades);

/**
 * GET /api/portal/my-classes
 * Get student's enrolled classes (for LMS)
 */
router.get('/my-classes', restrictTo('STUDENT'), portalController.getMyClasses);

/**
 * GET /api/portal/class/:classId
 * Get class details for student
 */
router.get('/class/:classId', restrictTo('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'), portalController.getClassInfo);

/**
 * GET /api/portal/dashboard
 * Get student dashboard data
 */
router.get('/dashboard', restrictTo('STUDENT'), portalController.getStudentDashboard);

export default router;