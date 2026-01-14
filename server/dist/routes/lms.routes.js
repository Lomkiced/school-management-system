"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/lms.routes.ts
const express_1 = require("express");
const lmsController = __importStar(require("../controllers/lms.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware"); // <--- Added Auth
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// === PROTECT ALL ROUTES ===
// This populates req.user, which we need for the fix
router.use(auth_middleware_1.authenticate);
// === ASSIGNMENTS ===
router.post('/class/:classId/assignments', upload_middleware_1.upload.single('file'), lmsController.createAssignment);
router.get('/class/:classId/assignments', lmsController.getAssignments);
// === SUBMISSIONS ===
router.post('/assignments/submit', upload_middleware_1.upload.single('file'), lmsController.submitAssignment);
router.post('/submissions/:submissionId/grade', lmsController.gradeSubmission);
// === MATERIALS ===
router.post('/class/:classId/materials', upload_middleware_1.upload.single('file'), lmsController.uploadMaterial);
router.get('/class/:classId/materials', lmsController.getMaterials);
// === QUIZZES ===
router.post('/class/:classId/quizzes', lmsController.createQuiz);
router.get('/quizzes/:quizId', lmsController.getQuiz);
router.post('/quizzes/:quizId/submit', lmsController.submitQuiz);
exports.default = router;
