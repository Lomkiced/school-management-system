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
exports.ClassController = exports.getFormOptions = exports.getClassStats = exports.getClassStudents = exports.unenrollStudent = exports.enrollStudent = exports.deleteClass = exports.updateClass = exports.createClass = exports.getClassById = exports.getClasses = void 0;
const classService = __importStar(require("../services/class.service"));
/**
 * Get all classes
 */
const getClasses = async (req, res) => {
    try {
        const classes = await classService.getAllClasses();
        res.json({
            success: true,
            data: classes,
            count: classes.length
        });
    }
    catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch classes'
        });
    }
};
exports.getClasses = getClasses;
/**
 * Get a single class by ID
 */
const getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format (UUID)
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const cls = await classService.getClassById(id);
        if (!cls) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.json({ success: true, data: cls });
    }
    catch (error) {
        console.error('Error fetching class:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch class'
        });
    }
};
exports.getClassById = getClassById;
/**
 * Create a new class
 */
const createClass = async (req, res) => {
    try {
        const { name, teacherId, subjectId } = req.body;
        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Class name is required'
            });
        }
        const newClass = await classService.createClass({
            name: name.trim(),
            teacherId: teacherId || undefined,
            subjectId: subjectId || undefined
        });
        res.status(201).json({
            success: true,
            data: newClass,
            message: 'Class created successfully'
        });
    }
    catch (error) {
        console.error('Error creating class:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create class'
        });
    }
};
exports.createClass = createClass;
/**
 * Update an existing class
 */
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, teacherId, subjectId } = req.body;
        // Validate ID
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        // Validate at least one field to update
        if (!name && !teacherId && !subjectId) {
            return res.status(400).json({
                success: false,
                message: 'At least one field must be provided for update'
            });
        }
        const updateData = {};
        if (name)
            updateData.name = name.trim();
        if (teacherId !== undefined)
            updateData.teacherId = teacherId;
        if (subjectId !== undefined)
            updateData.subjectId = subjectId;
        const updated = await classService.updateClass(id, updateData);
        res.json({
            success: true,
            data: updated,
            message: 'Class updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating class:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update class'
        });
    }
};
exports.updateClass = updateClass;
/**
 * Delete a class
 */
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        await classService.deleteClass(id);
        res.json({
            success: true,
            message: 'Class deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting class:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete class'
        });
    }
};
exports.deleteClass = deleteClass;
/**
 * Enroll a student in a class
 */
const enrollStudent = async (req, res) => {
    try {
        const { classId } = req.params;
        const { studentId } = req.body;
        // Validation
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
        const enrollment = await classService.enrollStudent(classId, studentId);
        res.status(201).json({
            success: true,
            data: enrollment,
            message: 'Student enrolled successfully'
        });
    }
    catch (error) {
        console.error('Error enrolling student:', error);
        // Handle specific errors
        if (error.message.includes('already enrolled')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to enroll student'
        });
    }
};
exports.enrollStudent = enrollStudent;
/**
 * Remove a student from a class
 */
const unenrollStudent = async (req, res) => {
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
        await classService.unenrollStudent(classId, studentId);
        res.json({
            success: true,
            message: 'Student unenrolled successfully'
        });
    }
    catch (error) {
        console.error('Error unenrolling student:', error);
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
};
exports.unenrollStudent = unenrollStudent;
/**
 * Get students enrolled in a class
 */
const getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const students = await classService.getClassStudents(classId);
        res.json({
            success: true,
            data: students,
            count: students.length
        });
    }
    catch (error) {
        console.error('Error fetching class students:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch students'
        });
    }
};
exports.getClassStudents = getClassStudents;
/**
 * Get class statistics
 */
const getClassStats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const stats = await classService.getClassStats(id);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching class stats:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch class statistics'
        });
    }
};
exports.getClassStats = getClassStats;
/**
 * Get form options (teachers, subjects)
 */
const getFormOptions = async (req, res) => {
    try {
        const options = await classService.getFormOptions();
        res.json({
            success: true,
            data: options
        });
    }
    catch (error) {
        console.error('Error fetching form options:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch form options'
        });
    }
};
exports.getFormOptions = getFormOptions;
// Export as both named exports and default object for flexibility
exports.ClassController = {
    getClasses: exports.getClasses,
    getClassById: exports.getClassById,
    createClass: exports.createClass,
    updateClass: exports.updateClass,
    deleteClass: exports.deleteClass,
    enrollStudent: exports.enrollStudent,
    unenrollStudent: exports.unenrollStudent,
    getClassStudents: exports.getClassStudents,
    getClassStats: exports.getClassStats,
    getFormOptions: exports.getFormOptions
};
