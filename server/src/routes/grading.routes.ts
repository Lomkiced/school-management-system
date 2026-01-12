// FILE: server/src/routes/grading.routes.ts
import { Router } from 'express';
import * as gradingController from '../controllers/grading.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// 1. Get Grades (Teachers see class, Students see own)
router.get('/', restrictTo('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), gradingController.getGrades);

// 2. Submit/Update Grades (Teachers Only)
router.post('/', restrictTo('TEACHER', 'ADMIN'), gradingController.submitGrade);

export default router;