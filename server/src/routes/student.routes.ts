// FILE: server/src/routes/student.routes.ts
import { Router } from 'express';
import { createBulkStudents, createStudent, deleteStudent, getStudent, getStudents, getUnenrolledStudents, toggleStatus, updateStudent } from '../controllers/student.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createStudentSchema, updateStudentSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

// READ
router.get('/', restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getStudents);
router.get('/unenrolled', restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getUnenrolledStudents);
router.get('/:id', restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getStudent);

// WRITE
router.post('/', restrictTo('SUPER_ADMIN', 'ADMIN'), validate(z.object({ body: createStudentSchema })), createStudent);
router.patch('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), validate(z.object({ body: updateStudentSchema })), updateStudent);

// STATUS & DELETE
router.patch('/:id/status', restrictTo('SUPER_ADMIN', 'ADMIN'), toggleStatus);
router.delete('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), deleteStudent);

// BULK
router.post('/bulk', restrictTo('SUPER_ADMIN', 'ADMIN'), createBulkStudents);

export default router;