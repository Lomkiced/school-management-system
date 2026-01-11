// FILE: server/src/utils/validation.ts
import { z } from 'zod';

// ================= AUTH SCHEMAS =================
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
});

// ================= STUDENT SCHEMAS =================
export const createStudentSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().or(z.date()).transform((val) => new Date(val)),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  // FIX: Allow password to pass through validation
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const updateStudentSchema = createStudentSchema.partial().omit({ email: true, password: true });

// ================= TEACHER SCHEMAS =================
export const createTeacherSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  // FIX: Allow password here too
  password: z.string().min(6).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial().omit({ email: true, password: true });

// ================= LMS / ASSIGNMENT SCHEMAS =================
export const assignmentSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  maxScore: z.number().or(z.string().transform(v => parseInt(v))).default(100),
});

export const gradeSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

// ================= QUIZ SCHEMAS =================
const questionSchema = z.object({
  text: z.string().min(1, "Question text required"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctOption: z.number().min(0),
  points: z.number().default(1)
});

export const quizSchema = z.object({
  title: z.string().min(3, "Quiz title required"),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, "At least 1 question required"),
  timeLimit: z.number().optional() // in minutes
});