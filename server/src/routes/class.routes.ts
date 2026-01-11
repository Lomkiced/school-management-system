// FILE: server/src/routes/class.routes.ts
import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// READ: Everyone needs to see classes
router.get('/', ClassController.getClasses);
router.get('/:id', ClassController.getClassById);

// WRITE: Only Admins (and maybe Teachers?) can create/manage classes
router.post('/', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.createClass
);

router.patch('/:id', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.updateClass
);

// Enrollment is sensitive
router.post('/:classId/enroll', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  ClassController.enrollStudent
);

export default router;