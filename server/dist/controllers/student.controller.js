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
exports.StudentController = void 0;
exports.getStudents = getStudents;
exports.getStudent = getStudent;
exports.createStudent = createStudent;
exports.updateStudent = updateStudent;
exports.createBulkStudents = createBulkStudents;
exports.toggleStatus = toggleStatus;
exports.deleteStudent = deleteStudent;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const studentService = __importStar(require("../services/student.service"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const validation_1 = require("../utils/validation");
/**
 * Get all students with pagination and filters
 */
async function getStudents(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'ACTIVE';
        const result = await studentService.getAllStudents({
            page,
            limit,
            search,
            status: status
        });
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch students'
        });
    }
}
/**
 * Get a single student by ID
 */
async function getStudent(req, res) {
    try {
        const { id } = req.params;
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        const student = await studentService.getStudentById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        res.json({
            success: true,
            data: student
        });
    }
    catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch student'
        });
    }
}
/**
 * Create a new student
 */
async function createStudent(req, res) {
    try {
        const validatedData = validation_1.createStudentSchema.parse(req.body);
        const student = await studentService.createStudent(validatedData);
        res.status(201).json({
            success: true,
            data: student,
            message: 'Student created successfully'
        });
    }
    catch (error) {
        console.error('Create student error:', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.issues[0].message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create student'
        });
    }
}
/**
 * Update an existing student
 */
async function updateStudent(req, res) {
    try {
        const { id } = req.params;
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        const validatedData = validation_1.updateStudentSchema.parse(req.body);
        const student = await studentService.updateStudent(id, validatedData);
        res.json({
            success: true,
            data: student,
            message: 'Student updated successfully'
        });
    }
    catch (error) {
        console.error('Update student error:', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.issues[0].message
            });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update student'
        });
    }
}
/**
 * Bulk import students
 */
async function createBulkStudents(req, res) {
    try {
        const { students } = req.body;
        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No student data provided"
            });
        }
        const createdCount = await prisma_1.default.$transaction(async (tx) => {
            let count = 0;
            const errors = [];
            for (const student of students) {
                try {
                    // Check if user already exists
                    const exists = await tx.user.findUnique({
                        where: { email: student.email }
                    });
                    if (exists) {
                        errors.push(`Email ${student.email} already exists`);
                        continue;
                    }
                    // Hash default password
                    const hashedPassword = await bcryptjs_1.default.hash("Student123", 10);
                    // Create user with student profile
                    await tx.user.create({
                        data: {
                            email: student.email,
                            password: hashedPassword,
                            role: 'STUDENT',
                            studentProfile: {
                                create: {
                                    firstName: student.firstName,
                                    lastName: student.lastName,
                                    gender: student.gender || 'MALE',
                                    dateOfBirth: student.dateOfBirth
                                        ? new Date(student.dateOfBirth)
                                        : null,
                                    address: student.address || null,
                                    guardianName: student.guardianName || null,
                                    guardianPhone: student.guardianPhone || null
                                }
                            }
                        }
                    });
                    count++;
                }
                catch (err) {
                    errors.push(`Failed to create ${student.email}: ${err.message}`);
                }
            }
            return { count, errors };
        });
        res.status(201).json({
            success: true,
            message: `Successfully imported ${createdCount.count} students`,
            count: createdCount.count,
            errors: createdCount.errors.length > 0 ? createdCount.errors : undefined
        });
    }
    catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to import students"
        });
    }
}
/**
 * Toggle student active status
 */
async function toggleStatus(req, res) {
    try {
        const { id } = req.params;
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        await studentService.toggleStudentStatus(id);
        res.json({
            success: true,
            message: "Student status updated successfully"
        });
    }
    catch (error) {
        console.error('Toggle status error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update status'
        });
    }
}
/**
 * Permanently delete a student
 */
async function deleteStudent(req, res) {
    try {
        const { id } = req.params;
        if (!id || id.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        await studentService.deleteStudentPermanently(id);
        res.json({
            success: true,
            message: "Student deleted permanently"
        });
    }
    catch (error) {
        console.error('Delete student error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete student'
        });
    }
}
// Export as object
exports.StudentController = {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    createBulkStudents,
    toggleStatus,
    deleteStudent
};
