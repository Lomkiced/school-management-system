import { Router } from 'express';
import { changePassword, getLogs } from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/logs', authenticate, getLogs);
router.post('/password', authenticate, changePassword);

export default router;