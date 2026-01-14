"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/teacher.routes.ts
const express_1 = require("express");
const teacher_controller_1 = require("../controllers/teacher.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// READ
router.get('/', teacher_controller_1.TeacherController.getTeachers);
router.get('/:id', teacher_controller_1.TeacherController.getTeacherById);
// WRITE (Admins Only)
router.post('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), teacher_controller_1.TeacherController.createTeacher);
router.patch('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), teacher_controller_1.TeacherController.updateTeacher);
// STATUS TOGGLE (Activate/Deactivate)
router.patch('/:id/status', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), teacher_controller_1.TeacherController.toggleStatus);
exports.default = router;
