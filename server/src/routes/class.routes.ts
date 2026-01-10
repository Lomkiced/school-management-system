import { Router } from 'express';
import { createClass, getClasses, getOptions } from '../controllers/class.controller';

const router = Router();

router.get('/', getClasses);
router.post('/', createClass);
router.get('/options', getOptions); // Fetch dropdown data

export default router;