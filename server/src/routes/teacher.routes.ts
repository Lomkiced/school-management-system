import { Router } from 'express';
import { createTeacher, getTeachers } from '../controllers/teacher.controller';

const router = Router();

router.get('/', getTeachers);
router.post('/', createTeacher);

export default router;