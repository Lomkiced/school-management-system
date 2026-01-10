"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrollmentOptions = exports.enrollStudent = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const enrollStudent = async (data) => {
    // Check if already enrolled in this section
    const existing = await prisma_1.default.enrollment.findFirst({
        where: {
            studentId: data.studentId,
            sectionId: parseInt(data.sectionId)
        }
    });
    if (existing)
        throw new Error('Student is already enrolled in this section');
    return await prisma_1.default.enrollment.create({
        data: {
            studentId: data.studentId,
            sectionId: parseInt(data.sectionId)
        },
        include: {
            section: true,
            student: true
        }
    });
};
exports.enrollStudent = enrollStudent;
// Helper for dropdowns
const getEnrollmentOptions = async () => {
    const students = await prisma_1.default.student.findMany({
        orderBy: { lastName: 'asc' }
    });
    const sections = await prisma_1.default.section.findMany({
        include: { gradeLevel: true } // Include grade name (e.g., Grade 10)
    });
    return { students, sections };
};
exports.getEnrollmentOptions = getEnrollmentOptions;
