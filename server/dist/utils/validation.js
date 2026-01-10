"use strict";
// FILE: server/src/utils/validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizSchema = exports.gradeSchema = exports.assignmentSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ================= AUTHENTICATION =================
// Schema for Registering a new User
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    role: zod_1.z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(),
});
// Schema for Logging in
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// ================= LMS (ASSIGNMENTS) =================
// CRITICAL ADDITION: Validate Assignment Creation
// We use z.coerce.number() because FormData often sends numbers as strings
exports.assignmentSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters"),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }),
    maxScore: zod_1.z.coerce.number().min(1, "Max score must be at least 1"),
});
// Validate Grading a Submission
exports.gradeSchema = zod_1.z.object({
    grade: zod_1.z.coerce.number().min(0, "Grade cannot be negative"),
    feedback: zod_1.z.string().optional(),
});
// ================= MODULE: QUIZ VALIDATION =================
const optionSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, "Option text is required"),
    isCorrect: zod_1.z.boolean(),
});
const questionSchema = zod_1.z.object({
    text: zod_1.z.string().min(3, "Question text must be meaningful"),
    points: zod_1.z.number().min(1),
    type: zod_1.z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION"]),
    options: zod_1.z.array(optionSchema).min(2, "Must have at least 2 options for MC/TF"),
});
exports.quizSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Quiz title is required"),
    description: zod_1.z.string().optional(),
    duration: zod_1.z.number().min(5, "Duration must be at least 5 minutes"),
    passingScore: zod_1.z.number().min(1).max(100),
    questions: zod_1.z.array(questionSchema).min(1, "A quiz must have at least one question"),
});
