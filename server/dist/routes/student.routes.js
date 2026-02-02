"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/student.routes.ts
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// READ
router.get('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN', 'TEACHER'), student_controller_1.getStudents);
router.get('/unenrolled', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN', 'TEACHER'), student_controller_1.getUnenrolledStudents);
router.get('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN', 'TEACHER'), student_controller_1.getStudent);
// WRITE
router.post('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), student_controller_1.createStudent);
router.patch('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), student_controller_1.updateStudent);
// STATUS & DELETE
router.patch('/:id/status', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), student_controller_1.toggleStatus);
router.delete('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), student_controller_1.deleteStudent);
// BULK
router.post('/bulk', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), student_controller_1.createBulkStudents);
exports.default = router;
