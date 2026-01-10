import { Router } from 'express';
import { assignFee, createFee, getFees, getLedger, pay } from '../controllers/finance.controller';

const router = Router();

router.post('/structure', createFee);   // Create "Tuition"
router.get('/structure', getFees);      // List all Fees
router.post('/assign', assignFee);      // Charge a student
router.post('/pay', pay);               // Accept Payment
router.get('/ledger/:studentId', getLedger); // View Student Account

export default router;