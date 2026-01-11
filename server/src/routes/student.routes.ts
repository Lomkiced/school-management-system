// FILE: server/src/routes/student.routes.ts
import { Router } from 'express';
import { createBulkStudents, createStudent, getStudent, getStudents, updateStudent } from '../controllers/student.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getStudents);
router.get('/:id', restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getStudent);

// WRITE OPERATIONS
router.post('/', restrictTo('SUPER_ADMIN', 'ADMIN'), createStudent);

// === NEW: Allow Admins to Edit ===
router.patch('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), updateStudent);

router.post('/bulk', restrictTo('SUPER_ADMIN', 'ADMIN'), createBulkStudents);

export default router;