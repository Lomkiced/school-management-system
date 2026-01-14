"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSimpleGrade = exports.recordGrade = exports.getGrades = exports.getGradebook = void 0;
// FILE: server/src/services/grading.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));

/**
 * Get complete gradebook data for a class
 * Returns classInfo, enrolled students, terms, and all grades
 */
const getGradebook = (classId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Get Class Info with teacher and subject
    const classInfo = yield prisma_1.default.class.findUnique({
        where: { id: classId },
        include: {
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            subject: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            _count: {
                select: {
                    enrollments: true
                }
            }
        }
    });
    if (!classInfo) {
        throw new Error('Class not found');
    }
    // 2. Get enrolled students
    const enrollments = yield prisma_1.default.enrollment.findMany({
        where: { classId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    user: {
                        select: {
                            email: true
                        }
                    }
                }
            }
        },
        orderBy: {
            student: {
                lastName: 'asc'
            }
        }
    });
    const students = enrollments.map(e => e.student);
    // 3. Get all terms (grading periods)
    const terms = yield prisma_1.default.term.findMany({
        orderBy: { name: 'asc' }
    });
    // 4. Get all grades for this class
    const grades = yield prisma_1.default.grade.findMany({
        where: { classId },
        select: {
            id: true,
            studentId: true,
            termId: true,
            score: true,
            feedback: true,
            createdAt: true,
            updatedAt: true
        }
    });
    return {
        classInfo,
        students,
        terms,
        grades
    };
});
exports.getGradebook = getGradebook;

const getGrades = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, classId } = params;
    // 1. Fetch Grades based on filters
    const grades = yield prisma_1.default.grade.findMany({
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
});
exports.getGrades = getGrades;

const recordGrade = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate if student is enrolled in that class
    const enrollment = yield prisma_1.default.enrollment.findFirst({
        where: {
            studentId: data.studentId,
            classId: data.classId
        }
    });
    if (!enrollment)
        throw new Error("Student is not enrolled in this class");
    // Check if grade already exists for this student/class/term
    const existingGrade = yield prisma_1.default.grade.findFirst({
        where: {
            studentId: data.studentId,
            classId: data.classId,
            termId: data.termId
        }
    });
    if (existingGrade) {
        // Update existing grade
        return yield prisma_1.default.grade.update({
            where: { id: existingGrade.id },
            data: {
                score: parseFloat(data.score),
                feedback: data.feedback,
                updatedAt: new Date()
            }
        });
    }
    else {
        // Create new grade
        return yield prisma_1.default.grade.create({
            data: {
                studentId: data.studentId,
                classId: data.classId,
                termId: data.termId,
                score: parseFloat(data.score),
                feedback: data.feedback
            }
        });
    }
});
exports.recordGrade = recordGrade;

/**
 * Fallback: If your schema doesn't have SubjectId in Grade,
 * use this simplified version for recording grades just by Class/Term.
 */
const recordSimpleGrade = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.grade.create({
        data: {
            studentId: data.studentId,
            classId: data.classId,
            termId: data.termId,
            score: parseFloat(data.score),
            feedback: data.feedback
        }
    });
});
exports.recordSimpleGrade = recordSimpleGrade;
