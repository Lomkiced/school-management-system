// FILE: server/src/routes/finance.routes.ts
import { Router } from 'express';
import * as financeController from '../controllers/finance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// 1. Fee Structure Management (Admin Only)
router.get('/', restrictTo('ADMIN', 'SUPER_ADMIN'), financeController.getFeeList);
router.post('/', restrictTo('ADMIN', 'SUPER_ADMIN'), financeController.createFee);

// 2. Student Ledger (Admin & Parent/Student for their own)
// Note: You might want to refine the role check here later to allow students to see ONLY their own ledger
router.get('/ledger/:studentId', restrictTo('ADMIN', 'SUPER_ADMIN', 'PARENT', 'STUDENT'), financeController.getStudentLedger);

export default router;