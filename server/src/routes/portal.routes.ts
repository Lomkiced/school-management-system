import { Router } from 'express';
import { getMyGrades } from '../controllers/portal.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect this route! Only logged in users can see it.
router.get('/grades', authenticate, getMyGrades);

export default router;