import { Router } from 'express';
import { getGradeLevels, createGradeLevel, deleteGradeLevel } from '../controllers/grade-level.controller';

const router = Router();

router.get('/', getGradeLevels);
router.post('/', createGradeLevel);
router.delete('/:id', deleteGradeLevel);

export default router;
