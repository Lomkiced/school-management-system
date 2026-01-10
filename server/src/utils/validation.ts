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