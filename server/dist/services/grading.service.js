"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSimpleGrade = exports.recordGrade = exports.getGrades = void 0;
// FILE: server/src/services/grading.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
const getGrades = async (params) => {
    const { studentId, classId } = params;
    // 1. Fetch Grades based on filters
    const grades = await prisma_1.default.grade.findMany({
        where: {
            AND: [
                studentId ? { studentId } : {},
                classId ? { classId } : {}
            ]
        },
        include: {
            student: { select: { firstName: true, lastName: true } },
            class: { select: { name: true } },
            term: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    return grades;
};
exports.getGrades = getGrades;
const recordGrade = async (data) => {
    // Validate if student is enrolled in that class
    const enrollment = await prisma_1.default.enrollment.findFirst({
        where: {
            studentId: data.studentId,
            classId: data.classId
        }
    });
    if (!enrollment)
        throw new Error("Student is not enrolled in this class");
    // Upsert: Update if exists, Create if new
    return await prisma_1.default.grade.upsert({
        where: {
            studentId_classId_termId_subjectId: {
                studentId: data.studentId,
                classId: data.classId,
                termId: data.termId,
                subjectId: data.subjectId // If you grade by subject
            }
        },
        update: {
            score: parseFloat(data.score),
            feedback: data.feedback,
            updatedAt: new Date()
        },
        create: {
            studentId: data.studentId,
            classId: data.classId,
            termId: data.termId,
            subjectId: data.subjectId, // Ensure this matches your DB schema
            score: parseFloat(data.score),
            feedback: data.feedback,
            gradedById: data.gradedBy
        }
    });
};
exports.recordGrade = recordGrade;
/**
 * Fallback: If your schema doesn't have SubjectId in Grade,
 * use this simplified version for recording grades just by Class/Term.
 */
const recordSimpleGrade = async (data) => {
    return await prisma_1.default.grade.create({
        data: {
            studentId: data.studentId,
            classId: data.classId,
            termId: data.termId,
            score: parseFloat(data.score),
            feedback: data.feedback
        }
    });
};
exports.recordSimpleGrade = recordSimpleGrade;
