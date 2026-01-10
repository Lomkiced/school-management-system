import { Router } from 'express';
import { createBulkStudents, createStudent, getStudent, getStudents } from '../controllers/student.controller';

const router = Router();

// We will eventually add "Middleware" here to ensure only ADMINs can do this
router.get('/', getStudents);
router.post('/', createStudent);
router.get('/:id', getStudent);
router.post('/bulk', createBulkStudents);

export default router;