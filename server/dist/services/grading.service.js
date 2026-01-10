"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGrade = exports.getGradebook = exports.initTerms = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// 1. Initialize Terms (One-time setup helper)
const initTerms = async () => {
    const currentYear = await prisma_1.default.academicYear.findFirst({ where: { isCurrent: true } });
    if (!currentYear)
        throw new Error("No active Academic Year found.");
    // Check if terms already exist
    const existing = await prisma_1.default.term.findMany({ where: { academicYearId: currentYear.id } });
    if (existing.length > 0)
        return existing;
    // Create Q1 to Q4
    await prisma_1.default.term.createMany({
        data: [
            { name: '1st Quarter', academicYearId: currentYear.id, startDate: new Date(), endDate: new Date() },
            { name: '2nd Quarter', academicYearId: currentYear.id, startDate: new Date(), endDate: new Date() },
            { name: '3rd Quarter', academicYearId: currentYear.id, startDate: new Date(), endDate: new Date() },
            { name: '4th Quarter', academicYearId: currentYear.id, startDate: new Date(), endDate: new Date() },
        ]
    });
    return await prisma_1.default.term.findMany({ where: { academicYearId: currentYear.id } });
};
exports.initTerms = initTerms;
// 2. Get Gradebook (The Complex Query)
const getGradebook = async (classId) => {
    const id = parseInt(classId);
    // A. Get the class details (Subject/Section)
    const classInfo = await prisma_1.default.class.findUnique({
        where: { id },
        include: { subject: true, section: true }
    });
    if (!classInfo)
        throw new Error("Class not found");
    // B. Get all students enrolled in this SECTION
    const enrollments = await prisma_1.default.enrollment.findMany({
        where: { sectionId: classInfo.sectionId },
        include: {
            student: true // Just fetch the student data
        },
        // FIX: We sort the list of enrollments here, based on the student's name
        orderBy: {
            student: {
                lastName: 'asc'
            }
        }
    });
    // C. Get existing grades for this CLASS
    const grades = await prisma_1.default.grade.findMany({
        where: { classId: id }
    });
    // D. Get Terms
    const terms = await prisma_1.default.term.findMany({
        where: { academicYearId: classInfo.section.academicYearId },
        orderBy: { name: 'asc' }
    });
    return { classInfo, students: enrollments.map(e => e.student), grades, terms };
};
exports.getGradebook = getGradebook;
// 3. Submit/Update a Grade
const updateGrade = async (data) => {
    const { studentId, classId, termId, score } = data;
    // Upsert: Update if exists, Create if new
    return await prisma_1.default.grade.upsert({
        where: {
            studentId_classId_termId: {
                studentId,
                classId: parseInt(classId),
                termId: parseInt(termId)
            }
        },
        update: { score: parseFloat(score) },
        create: {
            studentId,
            classId: parseInt(classId),
            termId: parseInt(termId),
            score: parseFloat(score)
        }
    });
};
exports.updateGrade = updateGrade;
