// FILE: server/src/routes/analytics.routes.ts
import { Router } from 'express';
import { getCharts, getStats } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// Everyone needs the basic stats for the dashboard homepage
router.get('/stats', getStats);

// Only Admins should see the financial charts
router.get('/charts', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  getCharts
);

export default router;