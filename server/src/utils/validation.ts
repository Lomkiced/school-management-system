// FILE: server/src/utils/validation.ts

import { z } from 'zod';

// ================= AUTHENTICATION =================

// Schema for Registering a new User
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(),
});

// Schema for Logging in
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ================= LMS (ASSIGNMENTS) =================

// CRITICAL ADDITION: Validate Assignment Creation
// We use z.coerce.number() because FormData often sends numbers as strings
export const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1"),
});

// Validate Grading a Submission
export const gradeSchema = z.object({
  grade: z.coerce.number().min(0, "Grade cannot be negative"),
  feedback: z.string().optional(),
});

// ================= MODULE: QUIZ VALIDATION =================

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(3, "Question text must be meaningful"),
  points: z.number().min(1),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION"]),
  options: z.array(optionSchema).min(2, "Must have at least 2 options for MC/TF"),
});

export const quizSchema = z.object({
  title: z.string().min(3, "Quiz title is required"),
  description: z.string().optional(),
  duration: z.number().min(5, "Duration must be at least 5 minutes"),
  passingScore: z.number().min(1).max(100),
  questions: z.array(questionSchema).min(1, "A quiz must have at least one question"),
});

// ================= STUDENT VALIDATION =================

export const createStudentSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().or(z.date()).transform((val) => new Date(val)),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial().omit({ email: true });
// We usually don't allow changing email via this route (that's an Account setting)