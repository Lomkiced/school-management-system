import { Router } from 'express';
import { getMyClasses } from '../controllers/teacher-portal.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/classes', authenticate, getMyClasses);

export default router;