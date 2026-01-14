// FILE: server/src/routes/grading.routes.ts
// 2026 Standard: Comprehensive grading routes with role-based access

import { Router } from 'express';
import * as gradingController from '../controllers/grading.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

/**
 * GET /api/grading/:classId
 * Get complete gradebook for a class (class info, students, terms, grades)
 * Access: Teachers, Admins
 */
router.get('/:classId',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
    gradingController.getGradebook
);

/**
 * GET /api/grading
 * Get grades with optional filters (for student portal, etc.)
 * Access: All authenticated users
 */
router.get('/',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
    gradingController.getGrades
);

/**
 * POST /api/grading
 * Submit or update a grade
 * Access: Teachers, Admins
 */
router.post('/',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
    gradingController.submitGrade
);

export default router;