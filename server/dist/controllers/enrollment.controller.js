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
exports.EnrollmentController = void 0;
exports.enrollBulk = enrollBulk;
exports.getEnrollmentsByClass = getEnrollmentsByClass;
exports.getEnrollmentsByStudent = getEnrollmentsByStudent;
exports.getOptions = getOptions;
exports.unenrollStudent = unenrollStudent;
exports.getEnrollmentStats = getEnrollmentStats;
exports.transferStudent = transferStudent;
const enrollmentService = __importStar(require("../services/enrollment.service"));
/**
 * Enroll multiple students in a class (bulk enrollment)
 */
async function enrollBulk(req, res) {
    try {
        const { classId, studentIds } = req.body;
        // Validation
        if (!classId || classId.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required"
            });
        }
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select at least one student"
            });
        }
        // Validate all student IDs are strings
        const invalidIds = studentIds.filter(id => typeof id !== 'string' || id.trim().length === 0);
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: "All student IDs must be valid strings"
            });
        }
        const result = await enrollmentService.enrollStudentBulk(classId, studentIds);
        res.status(201).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error("Bulk enrollment error:", error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to enroll students'
        });
    }
}
/**
 * Get enrollments for a specific class
 */
async function getEnrollmentsByClass(req, res) {
    try {
        const { classId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const enrollments = await enrollmentService.getEnrollmentsByClass(classId);
        res.json({
            success: true,
            data: enrollments,
            count: enrollments.length
        });
    }
    catch (error) {
        console.error("Get enrollments by class error:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch enrollments'
        });
    }
}
/**
 * Get enrollments for a specific student
 */
async function getEnrollmentsByStudent(req, res) {
    try {
        const { studentId } = req.params;
        if (!studentId || studentId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        const enrollments = await enrollmentService.getEnrollmentsByStudent(studentId);
        res.json({
            success: true,
            data: enrollments,
            count: enrollments.length
        });
    }
    catch (error) {
        console.error("Get enrollments by student error:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch enrollments'
        });
    }
}
/**
 * Get options for enrollment forms (students and classes)
 */
async function getOptions(req, res) {
    try {
        const options = await enrollmentService.getEnrollmentOptions();
        res.json({
            success: true,
            data: options
        });
    }
    catch (error) {
        console.error("Get enrollment options error:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch enrollment options'
        });
    }
}
/**
 * Unenroll a student from a class
 */
async function unenrollStudent(req, res) {
    try {
        const { classId, studentId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        if (!studentId || studentId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        await enrollmentService.unenrollStudent(classId, studentId);
        res.json({
            success: true,
            message: 'Student unenrolled successfully'
        });
    }
    catch (error) {
        console.error("Unenroll student error:", error);
        if (error.message.includes('not enrolled')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to unenroll student'
        });
    }
}
/**
 * Get enrollment statistics
 */
async function getEnrollmentStats(req, res) {
    try {
        const stats = await enrollmentService.getEnrollmentStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error("Get enrollment stats error:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch enrollment statistics'
        });
    }
}
/**
 * Transfer a student from one class to another
 */
async function transferStudent(req, res) {
    try {
        const { studentId, fromClassId, toClassId } = req.body;
        // Validation
        if (!studentId || studentId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        if (!fromClassId || fromClassId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid source class ID format'
            });
        }
        if (!toClassId || toClassId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid destination class ID format'
            });
        }
        if (fromClassId === toClassId) {
            return res.status(400).json({
                success: false,
                message: 'Source and destination classes must be different'
            });
        }
        const enrollment = await enrollmentService.transferStudent(studentId, fromClassId, toClassId);
        res.json({
            success: true,
            data: enrollment,
            message: 'Student transferred successfully'
        });
    }
    catch (error) {
        console.error("Transfer student error:", error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('not enrolled') || error.message.includes('already enrolled')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to transfer student'
        });
    }
}
// Export as both named exports and object
exports.EnrollmentController = {
    enrollBulk,
    getEnrollmentsByClass,
    getEnrollmentsByStudent,
    getOptions,
    unenrollStudent,
    getEnrollmentStats,
    transferStudent
};
