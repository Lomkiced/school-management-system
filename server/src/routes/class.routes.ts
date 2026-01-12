// FILE: server/src/routes/class.routes.ts
import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== PUBLIC ROUTES (All authenticated users) ====================

/**
 * GET /api/classes
 * Get all classes with teacher, subject, and enrollment info
 */
router.get('/', ClassController.getClasses);

/**
 * GET /api/classes/:id
 * Get a single class with full details
 */
router.get('/:id', ClassController.getClassById);

/**
 * GET /api/classes/:classId/students
 * Get all students enrolled in a specific class
 */
router.get('/:classId/students', ClassController.getClassStudents);

/**
 * GET /api/classes/:id/stats
 * Get class statistics (enrollment count, average grade, attendance rate)
 */
router.get('/:id/stats', ClassController.getClassStats);

/**
 * GET /api/classes/options/form
 * Get form options (teachers, subjects) for creating/editing classes
 */
router.get('/options/form', 
  restrictTo('SUPER_ADMIN', 'ADMIN'),
  ClassController.getFormOptions
);

// ==================== ADMIN ONLY ROUTES ====================

/**
 * POST /api/classes
 * Create a new class
 * Body: { name, teacherId?, subjectId? }
 */
router.post('/', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.createClass
);

/**
 * PATCH /api/classes/:id
 * Update an existing class
 * Body: { name?, teacherId?, subjectId? }
 */
router.patch('/:id', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.updateClass
);

/**
 * DELETE /api/classes/:id
 * Delete a class
 */
router.delete('/:id', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.deleteClass
);

/**
 * POST /api/classes/:classId/enroll
 * Enroll a student in a class
 * Body: { studentId }
 */
router.post('/:classId/enroll', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.enrollStudent
);

/**
 * DELETE /api/classes/:classId/students/:studentId
 * Remove a student from a class
 */
router.delete('/:classId/students/:studentId', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.unenrollStudent
);

export default router;