// FILE: server/src/routes/teacher.routes.ts
import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// READ: Everyone can see the teacher list (directory), 
// BUT we might want to hide private data in the controller later.
router.get('/', TeacherController.getTeachers);

router.get('/:id', TeacherController.getTeacherById);

// WRITE: Only Admins can Hire/Fire/Edit Teachers
router.post('/', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  TeacherController.createTeacher
);

router.patch('/:id', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  TeacherController.updateTeacher
);

// We don't usually DELETE teachers (historical records), but if we do:
// router.delete('/:id', restrictTo('SUPER_ADMIN'), TeacherController.deleteTeacher);

export default router;