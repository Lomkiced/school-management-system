// FILE: server/src/routes/teacher-portal.routes.ts
import { Router } from 'express';
import * as teacherPortalController from '../controllers/teacher-portal.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

// Secure all routes
router.use(authenticate);
router.use(restrictTo('TEACHER'));

// Dashboard & Classes
router.get('/stats', teacherPortalController.getDashboardStats);
router.get('/classes', teacherPortalController.getClasses);

export default router;