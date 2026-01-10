"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuiz = exports.getQuiz = exports.createQuiz = exports.getClassMaterials = exports.uploadMaterial = exports.gradeSubmission = exports.submitAssignment = exports.getClassAssignments = exports.createAssignment = void 0;
// FILE: server/src/services/lms.service.ts
const client_1 = require("@prisma/client");
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
// ================= ASSIGNMENTS =================
const createAssignment = async (classId, data, file) => {
    return await prisma_1.default.$transaction(async (tx) => {
        const assignment = await tx.assignment.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: new Date(data.dueDate),
                maxScore: parseFloat(data.maxScore),
                classId: classId,
                fileUrl: file ? file.path : null,
                fileType: file ? file.mimetype : null
            }
        });
        try {
            (0, socket_1.getIO)().to(`class_${classId}`).emit('new_assignment', {
                title: `New Assignment: ${data.title}`,
                assignmentId: assignment.id
            });
        }
        catch (e) { /* Ignore socket error */ }
        return assignment;
    });
};
exports.createAssignment = createAssignment;
const getClassAssignments = async (classId, filter) => {
    // Simple filter logic
    return await prisma_1.default.assignment.findMany({
        where: { classId },
        include: { submissions: true },
        orderBy: { createdAt: 'desc' }
    });
};
exports.getClassAssignments = getClassAssignments;
// ================= SUBMISSIONS =================
const submitAssignment = async (studentId, assignmentId, file, content) => {
    return await prisma_1.default.submission.upsert({
        where: { studentId_assignmentId: { studentId, assignmentId } },
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
};
exports.submitAssignment = submitAssignment;
const gradeSubmission = async (submissionId, grade, feedback) => {
    const submission = await prisma_1.default.submission.update({
        where: { id: submissionId },
        data: { grade, feedback }
    });
    try {
        (0, socket_1.getIO)().to(`student_${submission.studentId}`).emit('grade_posted', {
            message: `Grade Posted: ${grade}`,
            assignmentId: submission.assignmentId
        });
    }
    catch (e) { /* Ignore */ }
    return submission;
};
exports.gradeSubmission = gradeSubmission;
// ================= MATERIALS =================
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
// ================= QUIZ ENGINE (NEW) =================
const createQuiz = async (classId, data) => {
    // Complex Transaction: Create Quiz -> Create Questions -> Create Options
    return await prisma_1.default.quiz.create({
        data: {
            classId,
            title: data.title,
            description: data.description,
            duration: data.duration,
            passingScore: data.passingScore,
            questions: {
                create: data.questions.map((q) => ({
                    text: q.text,
                    points: q.points,
                    type: q.type,
                    options: {
                        create: q.options.map((o) => ({
                            text: o.text,
                            isCorrect: o.isCorrect
                        }))
                    }
                }))
            }
        }
    });
};
exports.createQuiz = createQuiz;
const getQuiz = async (quizId) => {
    return await prisma_1.default.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                include: { options: true } // We send options to frontend (frontend must hide isCorrect!)
            }
        }
    });
};
exports.getQuiz = getQuiz;
// THE AUTO-GRADER
const submitQuiz = async (studentId, quizId, answers) => {
    // 1. Fetch the Quiz AND the Correct Answers (Source of Truth)
    const quiz = await prisma_1.default.quiz.findUnique({
        where: { id: quizId },
        include: { questions: { include: { options: true } } }
    });
    if (!quiz)
        throw new Error("Quiz not found");
    let totalScore = 0;
    // 2. Loop through every question and grade it
    const processedAnswers = answers.map(ans => {
        const question = quiz.questions.find(q => q.id === ans.questionId);
        if (!question)
            return null;
        let isCorrect = false;
        // Logic for Multiple Choice / True False
        if (question.type === client_1.QuestionType.MULTIPLE_CHOICE || question.type === client_1.QuestionType.TRUE_FALSE) {
            const correctOption = question.options.find(o => o.isCorrect);
            if (correctOption && correctOption.id === ans.selectedOptionId) {
                isCorrect = true;
            }
        }
        // Logic for Identification (Text Match - Case Insensitive)
        else if (question.type === client_1.QuestionType.IDENTIFICATION) {
            const correctOption = question.options.find(o => o.isCorrect);
            if (correctOption && ans.textAnswer) {
                if (ans.textAnswer.trim().toLowerCase() === correctOption.text.toLowerCase()) {
                    isCorrect = true;
                }
            }
        }
        if (isCorrect)
            totalScore += question.points;
        return {
            questionId: ans.questionId,
            selectedOptionId: ans.selectedOptionId,
            textAnswer: ans.textAnswer
        };
    }).filter(a => a !== null); // remove invalid answers
    // 3. Save the Attempt and the Score
    return await prisma_1.default.quizAttempt.create({
        data: {
            quizId,
            studentId,
            score: totalScore,
            finishedAt: new Date(),
            answers: {
                create: processedAnswers
            }
        }
    });
};
exports.submitQuiz = submitQuiz;
