"use strict";
// FILE: server/src/services/lms.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassMaterials = exports.uploadMaterial = exports.gradeSubmission = exports.submitAssignment = exports.getClassAssignments = exports.createAssignment = void 0;
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
// === ASSIGNMENTS ===
const createAssignment = async (classId, data, file) => {
    return await prisma_1.default.$transaction(async (tx) => {
        // 1. Create Assignment
        const assignment = await tx.assignment.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: new Date(data.dueDate),
                maxScore: parseFloat(data.maxScore),
                classId: classId,
                fileUrl: file ? file.path : null, // Store path if file exists
                fileType: file ? file.mimetype : null
            }
        });
        // 2. Notify Students (Safe Socket Call)
        try {
            (0, socket_1.getIO)().to(`class_${classId}`).emit('new_assignment', {
                title: `New Assignment: ${data.title}`,
                assignmentId: assignment.id,
                dueDate: assignment.dueDate
            });
        }
        catch (e) {
            console.warn("Socket not ready, skipping notification");
        }
        return assignment;
    });
};
exports.createAssignment = createAssignment;
// FIX: Added 'filter' argument to match the Controller call
const getClassAssignments = async (classId, filter = 'all') => {
    const where = { classId };
    // Logic to filter by Date
    if (filter === 'active') {
        where.dueDate = { gte: new Date() }; // Due date is in the future
    }
    else if (filter === 'past') {
        where.dueDate = { lt: new Date() }; // Due date is in the past
    }
    return await prisma_1.default.assignment.findMany({
        where,
        include: { submissions: true },
        orderBy: { createdAt: 'desc' }
    });
};
exports.getClassAssignments = getClassAssignments;
// === SUBMISSIONS ===
const submitAssignment = async (studentId, assignmentId, file, content) => {
    // Logic: Use Upsert to allow re-submissions
    const submission = await prisma_1.default.submission.upsert({
        where: {
            studentId_assignmentId: {
                studentId,
                assignmentId
            }
        },
        update: {
            fileUrl: file ? file.path : undefined,
            content: content || undefined,
            submittedAt: new Date()
        },
        create: {
            studentId,
            assignmentId,
            fileUrl: file ? file.path : null,
            content: content || null
        }
    });
    return submission;
};
exports.submitAssignment = submitAssignment;
const gradeSubmission = async (submissionId, grade, feedback) => {
    const submission = await prisma_1.default.submission.update({
        where: { id: submissionId },
        data: { grade, feedback }
    });
    // Notify Student
    try {
        (0, socket_1.getIO)().to(`student_${submission.studentId}`).emit('grade_posted', {
            message: `New Grade: ${grade}`,
            assignmentId: submission.assignmentId,
            feedback
        });
    }
    catch (e) {
        console.warn("Socket not ready");
    }
    return submission;
};
exports.gradeSubmission = gradeSubmission;
// === MATERIALS ===
const uploadMaterial = async (classId, title, file) => {
    return await prisma_1.default.subjectMaterial.create({
        data: {
            classId,
            title,
            fileUrl: file.path,
            fileType: file.mimetype
        }
    });
};
exports.uploadMaterial = uploadMaterial;
const getClassMaterials = async (classId) => {
    return await prisma_1.default.subjectMaterial.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' }
    });
};
exports.getClassMaterials = getClassMaterials;
