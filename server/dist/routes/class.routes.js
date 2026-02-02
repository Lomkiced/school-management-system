"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/class.routes.ts
const express_1 = require("express");
const class_controller_1 = require("../controllers/class.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ==================== PUBLIC ROUTES (All authenticated users) ====================
/**
 * GET /api/classes
 * Get all classes with teacher, subject, and enrollment info
 */
router.get('/', class_controller_1.ClassController.getClasses);
/**
 * GET /api/classes/:id
 * Get a single class with full details
 */
router.get('/:id', class_controller_1.ClassController.getClassById);
/**
 * GET /api/classes/:classId/students
 * Get all students enrolled in a specific class
 */
router.get('/:classId/students', class_controller_1.ClassController.getClassStudents);
/**
 * GET /api/classes/:id/stats
 * Get class statistics (enrollment count, average grade, attendance rate)
 */
router.get('/:id/stats', class_controller_1.ClassController.getClassStats);
/**
 * GET /api/classes/options/form
 * Get form options (teachers, subjects) for creating/editing classes
 */
router.get('/options/form', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), class_controller_1.ClassController.getFormOptions);
/**
 * POST /api/classes/:classId/enroll-bulk
 * Enroll multiple students at once
 */
router.post('/:classId/enroll-bulk', class_controller_1.ClassController.enrollStudents);
// ==================== ADMIN ONLY ROUTES ====================
/**
 * POST /api/classes
 * Create a new class
 * Body: { name, teacherId?, subjectId? }
 */
router.post('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), class_controller_1.ClassController.createClass);
/**
 * PATCH /api/classes/:id
 * Update an existing class
 * Body: { name?, teacherId?, subjectId? }
 */
router.patch('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), class_controller_1.ClassController.updateClass);
/**
 * DELETE /api/classes/:id
 * Delete a class
 */
router.delete('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), class_controller_1.ClassController.deleteClass);
/**
 * POST /api/classes/:classId/enroll
 * Enroll a student in a class
 * Body: { studentId }
 */
router.post('/:classId/enroll', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), class_controller_1.ClassController.enrollStudent);
/**
 * DELETE /api/classes/:classId/students/:studentId
 * Remove a student from a class
 */
router.delete('/:classId/students/:studentId', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), class_controller_1.ClassController.unenrollStudent);
exports.default = router;
