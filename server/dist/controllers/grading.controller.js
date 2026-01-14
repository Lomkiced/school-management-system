"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitGrade = exports.getGrades = exports.getGradebook = void 0;
// FILE: server/src/controllers/grading.controller.ts
// 2026 Standard: Comprehensive grading controller
const gradingService = __importStar(require("../services/grading.service"));

/**
 * Get complete gradebook for a class
 * Returns classInfo, enrolled students, terms, and all grades
 */
const getGradebook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { classId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const gradebook = yield gradingService.getGradebook(classId);
        res.json({
            success: true,
            data: gradebook
        });
    }
    catch (error) {
        console.error("Gradebook Error:", error);
        if (error.message === 'Class not found') {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch gradebook'
        });
    }
});
exports.getGradebook = getGradebook;

/**
 * Get grades with filters (for student portal, reports, etc.)
 */
const getGrades = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let studentId = req.query.studentId;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'STUDENT') {
            studentId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        }
        const grades = yield gradingService.getGrades({
            studentId,
            classId: req.query.classId
        });
        res.json({
            success: true,
            data: grades,
            count: grades.length
        });
    }
    catch (error) {
        console.error("Get Grades Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch grades'
        });
    }
});
exports.getGrades = getGrades;

/**
 * Submit or update a grade
 */
const submitGrade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentId, classId, termId, score, feedback } = req.body;
        // Validation
        if (!studentId || !classId || !termId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID, Class ID, and Term ID are required'
            });
        }
        if (score === undefined || score === null || score === '') {
            return res.status(400).json({
                success: false,
                message: 'Score is required'
            });
        }
        const numericScore = parseFloat(score);
        if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
            return res.status(400).json({
                success: false,
                message: 'Score must be a number between 0 and 100'
            });
        }
        const grade = yield gradingService.recordGrade({
            studentId,
            classId,
            termId,
            score: numericScore,
            feedback,
            gradedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
        });
        res.json({
            success: true,
            data: grade,
            message: 'Grade saved successfully'
        });
    }
    catch (error) {
        console.error("Submit Grade Error:", error);
        if (error.message.includes('not enrolled')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save grade'
        });
    }
});
exports.submitGrade = submitGrade;
