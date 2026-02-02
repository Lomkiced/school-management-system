// FILE: server/src/routes/promotion.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import * as PromotionService from '../services/promotion.service';

const router = Router();

router.use(authenticate);
router.use(restrictTo('ADMIN', 'SUPER_ADMIN'));

// GET /api/promotion/candidates/:classId
router.get('/candidates/:classId', async (req, res) => {
    try {
        const candidates = await PromotionService.getPromotionCandidates(req.params.classId);
        res.json({ success: true, data: candidates });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/promotion/process
router.post('/process', async (req, res) => {
    try {
        const { candidates, nextClassId } = req.body;
        const result = await PromotionService.processMassPromotion(candidates, nextClassId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
