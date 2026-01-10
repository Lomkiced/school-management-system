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
exports.submitQuiz = exports.getQuiz = exports.createQuiz = exports.getMaterials = exports.uploadMaterial = exports.gradeSubmission = exports.submitAssignment = exports.getAssignments = exports.createAssignment = void 0;
const zod_1 = require("zod");
const lmsService = __importStar(require("../services/lms.service"));
const prisma_1 = __importDefault(require("../utils/prisma")); // <--- Needed for Student Lookup
const validation_1 = require("../utils/validation");
const parseId = (id, name) => {
    const parsed = parseInt(id);
    if (isNaN(parsed))
        throw new Error(`Invalid ${name} ID`);
    return parsed;
};
// ================= ASSIGNMENTS =================
const createAssignment = async (req, res) => {
    try {
        const classId = parseId(req.params.classId, 'Class');
        const validatedData = validation_1.assignmentSchema.parse(req.body);
        const assignment = await lmsService.createAssignment(classId, validatedData, req.file);
        res.status(201).json({ success: true, data: assignment });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return res.status(400).json({ success: false, message: error.issues[0].message });
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createAssignment = createAssignment;
const getAssignments = async (req, res) => {
    try {
        const classId = parseId(req.params.classId, 'Class');
        const assignments = await lmsService.getClassAssignments(classId, 'all');
        res.json({ success: true, data: assignments });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.getAssignments = getAssignments;
// ================= SUBMISSIONS =================
const submitAssignment = async (req, res) => {
    try {
        const { studentId, assignmentId, content } = req.body;
        // Fallback: If studentId is missing, try to find it from the User Token
        let finalStudentId = studentId;
        if (!finalStudentId && req.user) {
            const student = await prisma_1.default.student.findUnique({ where: { userId: req.user.userId } });
            if (student)
                finalStudentId = student.id;
        }
        if (!finalStudentId || !assignmentId)
            return res.status(400).json({ success: false, message: "Missing fields" });
        const submission = await lmsService.submitAssignment(finalStudentId, parseInt(assignmentId), req.file, content);
        res.status(201).json({ success: true, data: submission });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.submitAssignment = submitAssignment;
const gradeSubmission = async (req, res) => {
    try {
        const submissionId = parseId(req.params.submissionId, 'Submission');
        const validated = validation_1.gradeSchema.parse(req.body);
        const result = await lmsService.gradeSubmission(submissionId, validated.grade, validated.feedback || '');
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.gradeSubmission = gradeSubmission;
// ================= MATERIALS =================
const uploadMaterial = async (req, res) => {
    try {
        const classId = parseId(req.params.classId, 'Class');
        if (!req.file || !req.body.title)
            return res.status(400).json({ success: false, message: 'File and Title required' });
        const material = await lmsService.uploadMaterial(classId, req.body.title, req.file);
        res.status(201).json({ success: true, data: material });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.uploadMaterial = uploadMaterial;
const getMaterials = async (req, res) => {
    try {
        const classId = parseId(req.params.classId, 'Class');
        const materials = await lmsService.getClassMaterials(classId);
        res.json({ success: true, data: materials });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.getMaterials = getMaterials;
// ================= QUIZZES =================
const createQuiz = async (req, res) => {
    try {
        const classId = parseId(req.params.classId, 'Class');
        const validatedData = validation_1.quizSchema.parse(req.body);
        const quiz = await lmsService.createQuiz(classId, validatedData);
        res.status(201).json({ success: true, data: quiz });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return res.status(400).json({ success: false, message: error.issues[0].message });
        res.status(400).json({ success: false, message: 'Failed to create quiz' });
    }
};
exports.createQuiz = createQuiz;
const getQuiz = async (req, res) => {
    try {
        const quiz = await lmsService.getQuiz(req.params.quizId);
        if (!quiz)
            return res.status(404).json({ success: false, message: "Quiz not found" });
        res.json({ success: true, data: quiz });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.getQuiz = getQuiz;
const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body;
        const quizId = req.params.quizId;
        const userId = req.user?.userId; // Get ID from Token
        // 1. Find the Student Profile associated with this User
        const student = await prisma_1.default.student.findUnique({
            where: { userId: userId }
        });
        if (!student) {
            return res.status(400).json({ success: false, message: "Student profile not found. Are you logged in as a student?" });
        }
        // 2. Submit using the correct Student ID
        const attempt = await lmsService.submitQuiz(student.id, quizId, answers);
        res.status(201).json({ success: true, data: attempt });
    }
    catch (error) {
        console.error("Quiz Submit Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.submitQuiz = submitQuiz;
