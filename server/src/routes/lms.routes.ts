import { Router } from 'express';
import * as lmsController from '../controllers/lms.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// === ASSIGNMENTS ===
router.post('/classes/:classId/assignments', lmsController.createAssignment);
router.get('/classes/:classId/assignments', lmsController.getAssignments);

// === SUBMISSIONS ===
// Note: 'file' matches the key used in the frontend FormData
router.post('/submissions', upload.single('file'), lmsController.submitAssignment);
router.put('/submissions/:submissionId/grade', lmsController.gradeSubmission);

// === MATERIALS ===
router.post('/classes/:classId/materials', upload.single('file'), lmsController.uploadMaterial);
router.get('/classes/:classId/materials', lmsController.getMaterials);

export default router;