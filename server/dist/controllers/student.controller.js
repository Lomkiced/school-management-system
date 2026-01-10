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
exports.createBulkStudents = exports.createStudent = exports.getStudent = exports.getStudents = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const studentService = __importStar(require("../services/student.service"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// ... Keep your existing getStudents, getStudent, createStudent functions ...
const getStudents = async (req, res) => {
    try {
        const students = await studentService.getAllStudents();
        res.json({ success: true, data: students });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudents = getStudents;
const getStudent = async (req, res) => {
    try {
        const student = await studentService.getStudentById(req.params.id);
        if (!student)
            return res.status(404).json({ success: false, message: 'Student not found' });
        res.json({ success: true, data: student });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudent = getStudent;
const createStudent = async (req, res) => {
    try {
        const student = await studentService.createStudent(req.body);
        res.status(201).json({ success: true, data: student });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createStudent = createStudent;
// === THIS IS THE FIXED BULK IMPORT FUNCTION ===
const createBulkStudents = async (req, res) => {
    try {
        const students = req.body.students;
        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ success: false, message: "No student data provided" });
        }
        const createdCount = await prisma_1.default.$transaction(async (tx) => {
            let count = 0;
            for (const student of students) {
                const exists = await tx.user.findUnique({ where: { email: student.email } });
                if (exists)
                    continue;
                const hashedPassword = await bcryptjs_1.default.hash("Student123", 10);
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
                                // FIXED: Added missing required fields
                                admissionDate: new Date(),
                                dateOfBirth: new Date('2000-01-01') // Default Birthday
                            }
                        }
                    }
                });
                count++;
            }
            return count;
        });
        res.status(201).json({
            success: true,
            message: `Successfully imported ${createdCount} students`,
            count: createdCount
        });
    }
    catch (error) {
        console.error("Bulk Import Error:", error);
        res.status(500).json({ success: false, message: "Failed to import students" });
    }
};
exports.createBulkStudents = createBulkStudents;
