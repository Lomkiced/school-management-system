// FILE: server/src/routes/enrollment.routes.ts
import { Router } from 'express';
import { enrollBulk, getOptions } from '../controllers/enrollment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

// 1. Lock down all routes
router.use(authenticate);

// 2. Read Access (Teachers/Admins)
router.get('/options', 
  restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), 
  getOptions
);

// 3. Write Access (Admins Only)
// Switched from '/' to '/bulk' to be explicit
router.post('/bulk', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  enrollBulk
);

export default router;