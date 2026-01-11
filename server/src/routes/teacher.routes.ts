// FILE: server/src/routes/teacher.routes.ts
import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// READ
router.get('/', TeacherController.getTeachers);
router.get('/:id', TeacherController.getTeacherById);

// WRITE (Admins Only)
router.post('/', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  TeacherController.createTeacher
);

router.patch('/:id', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  TeacherController.updateTeacher
);

// STATUS TOGGLE (Activate/Deactivate)
router.patch('/:id/status', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  TeacherController.toggleStatus
);

export default router;