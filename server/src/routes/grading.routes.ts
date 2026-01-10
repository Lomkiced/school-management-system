import { Router } from 'express';
import { getGradebook, initialize, submitGrade } from '../controllers/grading.controller';
import { authenticate } from '../middlewares/auth.middleware'; // Import Middleware

const router = Router();

// Protect these routes! Now req.user will exist.
router.post('/init', authenticate, initialize);
router.get('/:classId', authenticate, getGradebook);
router.post('/', authenticate, submitGrade); // This was the culprit

export default router;