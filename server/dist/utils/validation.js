"use strict";
// FILE: server/src/utils/validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeSchema = exports.assignmentSchema = exports.loginSchema = exports.registerSchema = void 0;
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
