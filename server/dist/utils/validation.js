"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkAttendanceSchema = exports.createAttendanceSchema = exports.updateGradeSchema = exports.createGradeSchema = exports.bulkEnrollSchema = exports.enrollStudentSchema = exports.updateClassSchema = exports.createClassSchema = exports.linkStudentSchema = exports.updateParentSchema = exports.createParentSchema = exports.quizSchemaSimplified = exports.quizSchema = exports.gradeSchema = exports.assignmentSchema = exports.updateTeacherSchema = exports.createTeacherSchema = exports.updateStudentSchema = exports.createStudentSchema = exports.registerSchema = exports.loginSchema = void 0;
// FILE: server/src/utils/validation.ts
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
// ================= AUTH SCHEMAS =================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    firstName: zod_1.z.string().min(2, "First name is required"),
    lastName: zod_1.z.string().min(2, "Last name is required"),
});
// ================= STUDENT SCHEMAS =================
exports.createStudentSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    dateOfBirth: zod_1.z.string().or(zod_1.z.date()).transform((val) => new Date(val)),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]),
    address: zod_1.z.string().optional(),
    guardianName: zod_1.z.string().optional(),
    guardianPhone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters").optional(),
});
exports.updateStudentSchema = exports.createStudentSchema.partial().omit({ email: true, password: true });
// ================= TEACHER SCHEMAS =================
exports.createTeacherSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    specialization: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6).optional(),
});
exports.updateTeacherSchema = exports.createTeacherSchema.partial().omit({ email: true, password: true });
// ================= LMS / ASSIGNMENT SCHEMAS =================
exports.assignmentSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title is required"),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().min(1, "Due date is required"), // Keep as string for service
    maxScore: zod_1.z.union([
        zod_1.z.number(),
        zod_1.z.string().transform(v => parseFloat(v))
    ]).default(100),
});
exports.gradeSchema = zod_1.z.object({
    grade: zod_1.z.number().min(0).max(100),
    feedback: zod_1.z.string().optional(),
});
// ================= QUIZ SCHEMAS =================
const quizQuestionOptionSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, "Option text is required"),
    isCorrect: zod_1.z.boolean().default(false)
});
const quizQuestionSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, "Question text is required"),
    points: zod_1.z.number().positive().default(1),
    type: zod_1.z.nativeEnum(client_1.QuestionType).default(client_1.QuestionType.MULTIPLE_CHOICE),
    options: zod_1.z.array(quizQuestionOptionSchema).min(2, "At least 2 options required")
});
exports.quizSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Quiz title is required"),
    description: zod_1.z.string().optional(),
    duration: zod_1.z.number().positive("Duration must be positive").default(30), // in minutes
    passingScore: zod_1.z.number().min(0).max(100).default(60),
    questions: zod_1.z.array(quizQuestionSchema).min(1, "At least 1 question required")
});
// Alternative schema for simplified quiz creation (converts from old format)
exports.quizSchemaSimplified = zod_1.z.object({
    title: zod_1.z.string().min(3, "Quiz title is required"),
    description: zod_1.z.string().optional(),
    timeLimit: zod_1.z.number().optional().default(30),
    questions: zod_1.z.array(zod_1.z.object({
        text: zod_1.z.string().min(1, "Question text required"),
        options: zod_1.z.array(zod_1.z.string()).min(2, "At least 2 options required"),
        correctOption: zod_1.z.number().min(0),
        points: zod_1.z.number().default(1),
        type: zod_1.z.nativeEnum(client_1.QuestionType).optional().default(client_1.QuestionType.MULTIPLE_CHOICE)
    })).min(1, "At least 1 question required")
}).transform((data) => ({
    title: data.title,
    description: data.description,
    duration: data.timeLimit || 30,
    passingScore: 60, // Default passing score
    questions: data.questions.map(q => ({
        text: q.text,
        points: q.points,
        type: q.type || client_1.QuestionType.MULTIPLE_CHOICE,
        options: q.options.map((optText, idx) => ({
            text: optText,
            isCorrect: idx === q.correctOption
        }))
    }))
}));
// ================= PARENT SCHEMAS =================
exports.createParentSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    phone: zod_1.z.string().min(10, "Phone number is required"),
    address: zod_1.z.string().optional(),
    relationship: zod_1.z.string().default('Guardian'),
    password: zod_1.z.string().min(6).optional(),
});
exports.updateParentSchema = exports.createParentSchema.partial().omit({ email: true, password: true });
exports.linkStudentSchema = zod_1.z.object({
    studentIds: zod_1.z.array(zod_1.z.string()).min(1, "Select at least one student"),
});
// ================= CLASS SCHEMAS =================
exports.createClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Class name is required"),
    teacherId: zod_1.z.string().optional(),
    subjectId: zod_1.z.string().optional(),
});
exports.updateClassSchema = exports.createClassSchema.partial();
// ================= ENROLLMENT SCHEMAS =================
exports.enrollStudentSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, "Student ID is required"),
});
exports.bulkEnrollSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, "Class ID is required"),
    studentIds: zod_1.z.array(zod_1.z.string()).min(1, "At least one student is required"),
});
// ================= GRADE SCHEMAS =================
exports.createGradeSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, "Student ID is required"),
    classId: zod_1.z.string().min(1, "Class ID is required"),
    termId: zod_1.z.string().min(1, "Term ID is required"),
    score: zod_1.z.number().min(0).max(100),
    feedback: zod_1.z.string().optional(),
    subjectId: zod_1.z.string().optional(),
});
exports.updateGradeSchema = exports.createGradeSchema.partial().omit({ studentId: true, classId: true, termId: true });
// ================= ATTENDANCE SCHEMAS =================
exports.createAttendanceSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, "Student ID is required"),
    classId: zod_1.z.string().min(1, "Class ID is required"),
    date: zod_1.z.string().or(zod_1.z.date()).transform((val) => new Date(val)),
    status: zod_1.z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
});
exports.bulkAttendanceSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, "Class ID is required"),
    date: zod_1.z.string().or(zod_1.z.date()).transform((val) => new Date(val)),
    attendance: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().min(1),
        status: zod_1.z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"])
    })).min(1, "At least one attendance record is required")
});
