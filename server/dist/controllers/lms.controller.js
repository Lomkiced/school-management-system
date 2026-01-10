"use strict";
// FILE: server/src/controllers/lms.controller.ts
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
exports.getMaterials = exports.uploadMaterial = exports.gradeSubmission = exports.submitAssignment = exports.getAssignments = exports.createAssignment = void 0;
const zod_1 = require("zod");
const lmsService = __importStar(require("../services/lms.service"));
const validation_1 = require("../utils/validation");
// Helper: Parse ID safely
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
        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Assignment created successfully'
        });
    }
    catch (error) {
        // FIX: Use .issues or cast to any to satisfy strict mode
        if (error instanceof zod_1.ZodError) {
            const message = error.issues ? error.issues[0].message : 'Validation Error';
            return res.status(400).json({ success: false, message });
        }
        console.error("Create Assignment Error:", error);
        res.status(400).json({ success: false, message: error.message || 'Failed to create assignment' });
    }
};
exports.createAssignment = createAssignment;
const getAssignments = async (req, res) => {
    try {
        const classId = parseId(req.params.classId, 'Class');
        const filter = req.query.filter || 'all';
        const assignments = await lmsService.getClassAssignments(classId, filter);
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
        if (!studentId || !assignmentId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const pAssignmentId = parseId(assignmentId, 'Assignment');
        const submission = await lmsService.submitAssignment(studentId, pAssignmentId, req.file, content);
        res.status(201).json({ success: true, data: submission });
    }
    catch (error) {
        console.error("Submission Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.submitAssignment = submitAssignment;
const gradeSubmission = async (req, res) => {
    try {
        const submissionId = parseId(req.params.submissionId, 'Submission');
        const validatedGrade = validation_1.gradeSchema.parse(req.body);
        const result = await lmsService.gradeSubmission(submissionId, validatedGrade.grade, validatedGrade.feedback || '');
        res.json({ success: true, data: result });
    }
    catch (error) {
        // FIX: Use .issues for strict type safety
        if (error instanceof zod_1.ZodError) {
            const message = error.issues ? error.issues[0].message : 'Validation Error';
            return res.status(400).json({ success: false, message });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.gradeSubmission = gradeSubmission;
// ================= MATERIALS =================
const uploadMaterial = async (req, res) => {
    try {
        const classId = parseId(req.params.classId, 'Class');
        const { title } = req.body;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        const material = await lmsService.uploadMaterial(classId, title, req.file);
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
