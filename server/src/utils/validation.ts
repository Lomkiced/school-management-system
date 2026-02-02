// FILE: server/src/utils/validation.ts
import { QuestionType } from '@prisma/client';
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
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  gradeLevel: z.union([z.string(), z.number()]).transform(v => Number(v)).optional(),

  // Parent Account Creation Fields
  createParent: z.boolean().optional(),
  parentEmail: z.string().email().optional(),
  parentPassword: z.string().min(6).optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  existingParentId: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial().omit({ email: true });

// ================= TEACHER SCHEMAS =================
export const createTeacherSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  departmentId: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial().omit({ email: true, password: true });

// ================= LMS / ASSIGNMENT SCHEMAS =================
export const assignmentSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"), // Keep as string for service
  maxScore: z.union([
    z.number(),
    z.string().transform(v => parseFloat(v))
  ]).default(100),
});

export const gradeSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

// ================= QUIZ SCHEMAS =================
const quizQuestionOptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean().default(false)
});

const quizQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  points: z.number().positive().default(1),
  type: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
  options: z.array(quizQuestionOptionSchema).min(2, "At least 2 options required")
});

export const quizSchema = z.object({
  title: z.string().min(3, "Quiz title is required"),
  description: z.string().optional(),
  duration: z.number().positive("Duration must be positive").default(30), // in minutes
  passingScore: z.number().min(0).max(100).default(60),
  questions: z.array(quizQuestionSchema).min(1, "At least 1 question required")
});

// Alternative schema for simplified quiz creation (converts from old format)
export const quizSchemaSimplified = z.object({
  title: z.string().min(3, "Quiz title is required"),
  description: z.string().optional(),
  timeLimit: z.number().optional().default(30),
  questions: z.array(z.object({
    text: z.string().min(1, "Question text required"),
    options: z.array(z.string()).min(2, "At least 2 options required"),
    correctOption: z.number().min(0),
    points: z.number().default(1),
    type: z.nativeEnum(QuestionType).optional().default(QuestionType.MULTIPLE_CHOICE)
  })).min(1, "At least 1 question required")
}).transform((data) => ({
  title: data.title,
  description: data.description,
  duration: data.timeLimit || 30,
  passingScore: 60, // Default passing score
  questions: data.questions.map(q => ({
    text: q.text,
    points: q.points,
    type: q.type || QuestionType.MULTIPLE_CHOICE,
    options: q.options.map((optText, idx) => ({
      text: optText,
      isCorrect: idx === q.correctOption
    }))
  }))
}));

// ================= PARENT SCHEMAS =================
export const createParentSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().optional(),
  relationship: z.string().default('Guardian'),
  password: z.string().min(6).optional(),
});

export const updateParentSchema = createParentSchema.partial().omit({ email: true, password: true });

export const linkStudentSchema = z.object({
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
});

// ================= CLASS SCHEMAS =================
export const createClassSchema = z.object({
  name: z.string().min(3, "Class name is required"),
  teacherId: z.string().optional(),
  subjectId: z.string().optional(),
});

export const updateClassSchema = createClassSchema.partial();

// ================= ENROLLMENT SCHEMAS =================
export const enrollStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

export const bulkEnrollSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  studentIds: z.array(z.string()).min(1, "At least one student is required"),
});

// ================= GRADE SCHEMAS =================
export const createGradeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  termId: z.string().min(1, "Term ID is required"),
  score: z.number().min(0).max(100),
  feedback: z.string().optional(),
  subjectId: z.string().optional(),
});

export const updateGradeSchema = createGradeSchema.partial().omit({ studentId: true, classId: true, termId: true });

// ================= ATTENDANCE SCHEMAS =================
export const createAttendanceSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
});

export const bulkAttendanceSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  attendance: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"])
  })).min(1, "At least one attendance record is required")
});