"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssignment = createAssignment;
exports.getClassAssignments = getClassAssignments;
exports.getAssignmentById = getAssignmentById;
exports.submitAssignment = submitAssignment;
exports.gradeSubmission = gradeSubmission;
exports.getStudentSubmissions = getStudentSubmissions;
exports.uploadMaterial = uploadMaterial;
exports.getClassMaterials = getClassMaterials;
exports.deleteMaterial = deleteMaterial;
exports.createQuiz = createQuiz;
exports.getQuiz = getQuiz;
exports.getClassQuizzes = getClassQuizzes;
exports.submitQuiz = submitQuiz;
exports.getQuizAttempts = getQuizAttempts;
exports.getStudentQuizAttempts = getStudentQuizAttempts;
// FILE: server/src/services/lms.service.ts
const client_1 = require("@prisma/client");
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
// ================= ASSIGNMENTS =================
async function createAssignment(classId, data, file) {
    return await prisma_1.default.$transaction(async (tx) => {
        const assignment = await tx.assignment.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: new Date(data.dueDate),
                maxScore: parseFloat(data.maxScore.toString()),
                classId: classId,
                fileUrl: file ? file.path : null,
                fileType: file ? file.mimetype : null
            }
        });
        // Real-time notification via Socket.io
        try {
            (0, socket_1.getIO)().to(`class_${classId}`).emit('new_assignment', {
                title: `New Assignment: ${data.title}`,
                assignmentId: assignment.id
            });
        }
        catch (e) {
            console.error('Socket notification failed:', e);
        }
        return assignment;
    });
}
async function getClassAssignments(classId, filter) {
    return await prisma_1.default.assignment.findMany({
        where: { classId },
        include: {
            submissions: {
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            },
            class: {
                select: {
                    name: true,
                    subject: {
                        select: {
                            name: true,
                            code: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}
async function getAssignmentById(assignmentId) {
    return await prisma_1.default.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            submissions: {
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            },
            class: {
                select: {
                    name: true,
                    teacher: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        }
    });
}
// ================= SUBMISSIONS =================
async function submitAssignment(studentId, assignmentId, file, content) {
    return await prisma_1.default.submission.upsert({
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
        },
        include: {
            assignment: {
                select: {
                    title: true,
                    maxScore: true
                }
            }
        }
    });
}
async function gradeSubmission(submissionId, grade, feedback) {
    const submission = await prisma_1.default.submission.update({
        where: { id: submissionId },
        data: {
            grade,
            feedback,
            gradedAt: new Date()
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            assignment: {
                select: {
                    title: true,
                    maxScore: true
                }
            }
        }
    });
    // Real-time notification
    try {
        (0, socket_1.getIO)().to(`student_${submission.studentId}`).emit('grade_posted', {
            message: `Grade Posted: ${grade}`,
            assignmentId: submission.assignmentId
        });
    }
    catch (e) {
        console.error('Socket notification failed:', e);
    }
    return submission;
}
async function getStudentSubmissions(studentId) {
    return await prisma_1.default.submission.findMany({
        where: { studentId },
        include: {
            assignment: {
                select: {
                    title: true,
                    dueDate: true,
                    maxScore: true,
                    class: {
                        select: {
                            name: true,
                            subject: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { submittedAt: 'desc' }
    });
}
// ================= MATERIALS =================
async function uploadMaterial(classId, title, file) {
    return await prisma_1.default.subjectMaterial.create({
        data: {
            classId,
            title,
            fileUrl: file.path,
            fileType: file.mimetype
        },
        include: {
            class: {
                select: {
                    name: true,
                    subject: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });
}
async function getClassMaterials(classId) {
    return await prisma_1.default.subjectMaterial.findMany({
        where: { classId },
        include: {
            class: {
                select: {
                    name: true,
                    subject: {
                        select: {
                            name: true,
                            code: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}
async function deleteMaterial(materialId) {
    return await prisma_1.default.subjectMaterial.delete({
        where: { id: materialId }
    });
}
// ================= QUIZ ENGINE =================
async function createQuiz(classId, data) {
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
        },
        include: {
            questions: {
                include: {
                    options: true
                }
            }
        }
    });
}
async function getQuiz(quizId) {
    return await prisma_1.default.quiz.findUnique({
        where: { id: quizId },
        include: {
            class: {
                select: {
                    name: true,
                    subject: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            questions: {
                include: {
                    options: true
                }
            }
        }
    });
}
async function getClassQuizzes(classId) {
    return await prisma_1.default.quiz.findMany({
        where: { classId },
        include: {
            _count: {
                select: {
                    attempts: true,
                    questions: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}
// ================= QUIZ AUTO-GRADER =================
async function submitQuiz(studentId, quizId, answers) {
    // 1. Fetch the Quiz with correct answers
    const quiz = await prisma_1.default.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                include: {
                    options: true
                }
            }
        }
    });
    if (!quiz) {
        throw new Error("Quiz not found");
    }
    let totalScore = 0;
    // 2. Grade each answer
    const processedAnswers = answers.map(ans => {
        const question = quiz.questions.find((q) => q.id === ans.questionId);
        if (!question)
            return null;
        let isCorrect = false;
        // Multiple Choice / True False
        if (question.type === client_1.QuestionType.MULTIPLE_CHOICE ||
            question.type === client_1.QuestionType.TRUE_FALSE) {
            const correctOption = question.options.find((o) => o.isCorrect);
            if (correctOption && correctOption.id === ans.selectedOptionId) {
                isCorrect = true;
            }
        }
        // Identification (Text Match - Case Insensitive)
        else if (question.type === client_1.QuestionType.IDENTIFICATION) {
            const correctOption = question.options.find((o) => o.isCorrect);
            if (correctOption && ans.textAnswer) {
                if (ans.textAnswer.trim().toLowerCase() === correctOption.text.toLowerCase()) {
                    isCorrect = true;
                }
            }
        }
        if (isCorrect) {
            totalScore += question.points;
        }
        return {
            questionId: ans.questionId,
            selectedOptionId: ans.selectedOptionId,
            textAnswer: ans.textAnswer
        };
    }).filter((a) => a !== null);
    // 3. Save the attempt
    return await prisma_1.default.quizAttempt.create({
        data: {
            quizId,
            studentId,
            score: totalScore,
            finishedAt: new Date(),
            answers: {
                create: processedAnswers
            }
        },
        include: {
            quiz: {
                select: {
                    title: true,
                    passingScore: true
                }
            },
            answers: {
                include: {
                    question: true,
                    selectedOption: true
                }
            }
        }
    });
}
async function getQuizAttempts(quizId) {
    return await prisma_1.default.quizAttempt.findMany({
        where: { quizId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            quiz: {
                select: {
                    title: true,
                    passingScore: true
                }
            }
        },
        orderBy: { finishedAt: 'desc' }
    });
}
async function getStudentQuizAttempts(studentId) {
    return await prisma_1.default.quizAttempt.findMany({
        where: { studentId },
        include: {
            quiz: {
                select: {
                    title: true,
                    passingScore: true,
                    class: {
                        select: {
                            name: true,
                            subject: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { finishedAt: 'desc' }
    });
}
