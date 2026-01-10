// FILE: server/src/routes/lms.routes.ts
import { Router } from 'express';
import * as lmsController from '../controllers/lms.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// === ASSIGNMENTS ===
router.post('/class/:classId/assignments', upload.single('file'), lmsController.createAssignment);
router.get('/class/:classId/assignments', lmsController.getAssignments);

// === SUBMISSIONS ===
router.post('/assignments/submit', upload.single('file'), lmsController.submitAssignment);
router.post('/submissions/:submissionId/grade', lmsController.gradeSubmission);

// === MATERIALS ===
router.post('/class/:classId/materials', upload.single('file'), lmsController.uploadMaterial);
router.get('/class/:classId/materials', lmsController.getMaterials);

// === QUIZZES (NEW) ===
router.post('/class/:classId/quizzes', lmsController.createQuiz);
router.get('/quizzes/:quizId', lmsController.getQuiz);
router.post('/quizzes/:quizId/submit', lmsController.submitQuiz);

export default router;