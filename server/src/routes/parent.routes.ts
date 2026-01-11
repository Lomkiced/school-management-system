// FILE: server/src/routes/parent.routes.ts
import { Router } from 'express';
import { createParent, deleteParent, getParents, linkStudents, updateParent } from '../controllers/parent.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// Admins manage parents
router.get('/', restrictTo('SUPER_ADMIN', 'ADMIN'), getParents);
router.post('/', restrictTo('SUPER_ADMIN', 'ADMIN'), createParent);
router.patch('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), updateParent);
router.delete('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), deleteParent);

// Link Students
router.post('/:id/link', restrictTo('SUPER_ADMIN', 'ADMIN'), linkStudents);

export default router;