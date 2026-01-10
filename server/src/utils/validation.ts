import { z } from 'zod';

// Schema for Registering a new User
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(), // Default is STUDENT if not provided
});

// Schema for Logging in
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});