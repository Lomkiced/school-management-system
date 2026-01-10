import { Router } from 'express';
import { enroll, getOptions } from '../controllers/enrollment.controller';

const router = Router();

router.post('/', enroll);
router.get('/options', getOptions);

export default router;