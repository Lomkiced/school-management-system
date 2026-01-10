import { Router } from 'express';
import * as lmsController from '../controllers/lms.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Assignments
router.post('/class/:classId/assignments', upload.single('file'), lmsController.createAssignment);
router.get('/class/:classId/assignments', lmsController.getAssignments);

// Submissions
router.post('/assignments/submit', upload.single('file'), lmsController.submitAssignment);
router.post('/submissions/:submissionId/grade', lmsController.gradeSubmission);

// Materials
router.post('/class/:classId/materials', upload.single('file'), lmsController.uploadMaterial);
router.get('/class/:classId/materials', lmsController.getMaterials);

export default router;