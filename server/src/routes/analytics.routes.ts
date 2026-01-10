import { Router } from 'express';
import { getStats } from '../controllers/analytics.controller';

const router = Router();

router.get('/', getStats);

export default router;