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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMSController = void 0;
exports.createAssignment = createAssignment;
exports.getAssignments = getAssignments;
exports.getAssignmentById = getAssignmentById;
exports.submitAssignment = submitAssignment;
exports.gradeSubmission = gradeSubmission;
exports.getStudentSubmissions = getStudentSubmissions;
exports.uploadMaterial = uploadMaterial;
exports.getMaterials = getMaterials;
exports.deleteMaterial = deleteMaterial;
exports.createQuiz = createQuiz;
exports.getQuiz = getQuiz;
exports.getClassQuizzes = getClassQuizzes;
exports.submitQuiz = submitQuiz;
exports.getQuizAttempts = getQuizAttempts;
exports.getStudentQuizAttempts = getStudentQuizAttempts;
const zod_1 = require("zod");
const lmsService = __importStar(require("../services/lms.service"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const validation_1 = require("../utils/validation");
// ================= ASSIGNMENTS =================
async function createAssignment(req, res) {
    try {
        const { classId } = req.params;
        // Validate classId format
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const validatedData = validation_1.assignmentSchema.parse(req.body);
        const assignment = await lmsService.createAssignment(classId, validatedData, req.file);
        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Assignment created successfully'
        });
    }
    catch (error) {
        console.error('Create assignment error:', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.issues[0].message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create assignment'
        });
    }
}
async function getAssignments(req, res) {
    try {
        const { classId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const assignments = await lmsService.getClassAssignments(classId);
        res.json({
            success: true,
            data: assignments,
            count: assignments.length
        });
    }
    catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch assignments'
        });
    }
}
async function getAssignmentById(req, res) {
    try {
        const { assignmentId } = req.params;
        if (!assignmentId || assignmentId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID format'
            });
        }
        const assignment = await lmsService.getAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }
        res.json({
            success: true,
            data: assignment
        });
    }
    catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch assignment'
        });
    }
}
// ================= SUBMISSIONS =================
async function submitAssignment(req, res) {
    try {
        const { assignmentId, content } = req.body;
        let { studentId } = req.body;
        // If studentId not provided, get it from authenticated user
        if (!studentId && req.user) {
            const student = await prisma_1.default.student.findUnique({
                where: { userId: req.user.id }
            });
            if (student) {
                studentId = student.id;
            }
        }
        // Validation
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required or you must be logged in as a student'
            });
        }
        if (!assignmentId || assignmentId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID format'
            });
        }
        if (!req.file && !content) {
            return res.status(400).json({
                success: false,
                message: 'Either file or text content is required'
            });
        }
        const submission = await lmsService.submitAssignment(studentId, assignmentId, req.file, content);
        res.status(201).json({
            success: true,
            data: submission,
            message: 'Assignment submitted successfully'
        });
    }
    catch (error) {
        console.error('Submit assignment error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit assignment'
        });
    }
}
async function gradeSubmission(req, res) {
    try {
        const { submissionId } = req.params;
        if (!submissionId || submissionId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid submission ID format'
            });
        }
        const validated = validation_1.gradeSchema.parse(req.body);
        const result = await lmsService.gradeSubmission(submissionId, validated.grade, validated.feedback);
        res.json({
            success: true,
            data: result,
            message: 'Submission graded successfully'
        });
    }
    catch (error) {
        console.error('Grade submission error:', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.issues[0].message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to grade submission'
        });
    }
}
async function getStudentSubmissions(req, res) {
    try {
        let { studentId } = req.params;
        // If no studentId in params, get from authenticated user
        if (!studentId && req.user) {
            const student = await prisma_1.default.student.findUnique({
                where: { userId: req.user.id }
            });
            if (student) {
                studentId = student.id;
            }
        }
        if (!studentId || studentId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        const submissions = await lmsService.getStudentSubmissions(studentId);
        res.json({
            success: true,
            data: submissions,
            count: submissions.length
        });
    }
    catch (error) {
        console.error('Get student submissions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch submissions'
        });
    }
}
// ================= MATERIALS =================
async function uploadMaterial(req, res) {
    try {
        const { classId } = req.params;
        const { title } = req.body;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File is required'
            });
        }
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }
        const material = await lmsService.uploadMaterial(classId, title.trim(), req.file);
        res.status(201).json({
            success: true,
            data: material,
            message: 'Material uploaded successfully'
        });
    }
    catch (error) {
        console.error('Upload material error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to upload material'
        });
    }
}
async function getMaterials(req, res) {
    try {
        const { classId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const materials = await lmsService.getClassMaterials(classId);
        res.json({
            success: true,
            data: materials,
            count: materials.length
        });
    }
    catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch materials'
        });
    }
}
async function deleteMaterial(req, res) {
    try {
        const { materialId } = req.params;
        if (!materialId || materialId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid material ID format'
            });
        }
        await lmsService.deleteMaterial(materialId);
        res.json({
            success: true,
            message: 'Material deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete material error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete material'
        });
    }
}
// ================= QUIZZES =================
async function createQuiz(req, res) {
    try {
        const { classId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const validatedData = validation_1.quizSchema.parse(req.body);
        const quiz = await lmsService.createQuiz(classId, validatedData);
        res.status(201).json({
            success: true,
            data: quiz,
            message: 'Quiz created successfully'
        });
    }
    catch (error) {
        console.error('Create quiz error:', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.issues[0].message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create quiz'
        });
    }
}
async function getQuiz(req, res) {
    try {
        const { quizId } = req.params;
        if (!quizId || quizId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quiz ID format'
            });
        }
        const quiz = await lmsService.getQuiz(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }
        res.json({
            success: true,
            data: quiz
        });
    }
    catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch quiz'
        });
    }
}
async function getClassQuizzes(req, res) {
    try {
        const { classId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const quizzes = await lmsService.getClassQuizzes(classId);
        res.json({
            success: true,
            data: quizzes,
            count: quizzes.length
        });
    }
    catch (error) {
        console.error('Get class quizzes error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch quizzes'
        });
    }
}
async function submitQuiz(req, res) {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        if (!quizId || quizId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quiz ID format'
            });
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Find student profile
        const student = await prisma_1.default.student.findUnique({
            where: { userId: req.user.id }
        });
        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'Student profile not found. Are you logged in as a student?'
            });
        }
        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Answers are required'
            });
        }
        const attempt = await lmsService.submitQuiz(student.id, quizId, answers);
        res.status(201).json({
            success: true,
            data: attempt,
            message: 'Quiz submitted successfully'
        });
    }
    catch (error) {
        console.error('Submit quiz error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit quiz'
        });
    }
}
async function getQuizAttempts(req, res) {
    try {
        const { quizId } = req.params;
        if (!quizId || quizId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quiz ID format'
            });
        }
        const attempts = await lmsService.getQuizAttempts(quizId);
        res.json({
            success: true,
            data: attempts,
            count: attempts.length
        });
    }
    catch (error) {
        console.error('Get quiz attempts error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch quiz attempts'
        });
    }
}
async function getStudentQuizAttempts(req, res) {
    try {
        let { studentId } = req.params;
        // If no studentId, get from authenticated user
        if (!studentId && req.user) {
            const student = await prisma_1.default.student.findUnique({
                where: { userId: req.user.id }
            });
            if (student) {
                studentId = student.id;
            }
        }
        if (!studentId || studentId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        const attempts = await lmsService.getStudentQuizAttempts(studentId);
        res.json({
            success: true,
            data: attempts,
            count: attempts.length
        });
    }
    catch (error) {
        console.error('Get student quiz attempts error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch quiz attempts'
        });
    }
}
// Export as object for easy importing
exports.LMSController = {
    createAssignment,
    getAssignments,
    getAssignmentById,
    submitAssignment,
    gradeSubmission,
    getStudentSubmissions,
    uploadMaterial,
    getMaterials,
    deleteMaterial,
    createQuiz,
    getQuiz,
    getClassQuizzes,
    submitQuiz,
    getQuizAttempts,
    getStudentQuizAttempts
};
