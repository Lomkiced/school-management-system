// FILE: server/src/routes/finance.routes.ts
import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware'; // <--- IMPORT THIS

const router = Router();

// 1. Apply Authentication to ALL routes first
router.use(authenticate);

// 2. PUBLIC READ (Optional: If parents need to see their own fees, we'd handle that differently. 
//    For now, let's assume only Staff/Admins view the global fee list)
router.get('/fees', 
  restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER'), // Teachers might need to see fees? If not, remove 'TEACHER'
  FinanceController.getFees
);

// 3. RESTRICTED WRITE (Only Admins can create/edit fees)
router.post('/fees', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  FinanceController.createFee
);

// Ledger access - complex! 
// Usually, a student should only see THEIR OWN ledger.
// The controller likely needs logic for "If Student, enforce ID match".
// For now, let's protect the generic endpoint:
router.get('/student/:studentId', 
  restrictTo('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), 
  FinanceController.getStudentLedger
);

router.post('/payment', 
  restrictTo('SUPER_ADMIN', 'ADMIN'), 
  FinanceController.recordPayment
);

export default router;