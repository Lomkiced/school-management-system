// FILE: server/src/routes/student.routes.ts
import { Router } from 'express';
import {
    createBulkStudents,
    createStudent,
    deleteStudent, // <--- Import this
    getStudent,
    getStudents,
    updateStudent
} from '../controllers/student.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getStudents);
router.get('/:id', restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getStudent);

router.post('/', restrictTo('SUPER_ADMIN', 'ADMIN'), createStudent);
router.patch('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), updateStudent);

// === NEW: DELETE ROUTE ===
router.delete('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), deleteStudent);

router.post('/bulk', restrictTo('SUPER_ADMIN', 'ADMIN'), createBulkStudents);

export default router;