// FILE: server/src/routes/parent-portal.routes.ts
// Parent portal routes

import { Router } from 'express';
import { getChildDetails, getParentDashboard } from '../controllers/parent-portal.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(restrictTo('PARENT'));

router.get('/dashboard', getParentDashboard);
router.get('/children/:studentId', getChildDetails);

export default router;
