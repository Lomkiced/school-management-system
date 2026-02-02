// FILE: client/src/types/index.ts
// Centralized type definitions synced with Prisma schema
// 2026 Standard: Single source of truth for types

// ================= ENUMS =================
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type FeeStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type PaymentMethod = 'CASH' | 'ONLINE' | 'CHECK' | 'BANK_TRANSFER';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';

// ================= USER & AUTH =================
export interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    isActive?: boolean;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// ================= PROFILES =================
export interface Teacher {
    id: string;
    userId?: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address?: string | null;
}

// Extended teacher type with workload analytics
export interface TeacherWithWorkload {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    department?: {
        id: string;
        name: string;
        code?: string | null;
    } | null;
    classCount: number;
    studentCount: number;
    weeklyHours: number;
    maxWeeklyHours: number;
    workloadPercentage: number;
    availabilityStatus: 'available' | 'busy' | 'at_capacity';
    classes?: Array<{ id: string; name: string }>;
}

export interface Student {
    id: string;
    userId?: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    gender: Gender;
    address?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    parentId?: string | null;
    user?: {
        email: string;
        isActive: boolean;
    };
}

export interface Parent {
    id: string;
    userId?: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address?: string | null;
    students?: Student[];
}

// ================= ACADEMICS =================
export interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string | null;
}

export interface SchoolClass {
    id: string;
    name: string;
    teacherId?: string | null;
    teacher?: Teacher | null;
    subjectId?: string | null;
    subject?: Subject | null;
    enrollments?: Enrollment[];
    _count?: {
        enrollments: number;
    };
}

export interface Enrollment {
    id: string;
    studentId: string;
    classId: string;
    joinedAt: string;
    student?: Student;
    class?: SchoolClass;
}

export interface AcademicYear {
    id: string;
    name: string;
    isCurrent: boolean;
    startDate: string;
    endDate: string;
}

export interface Term {
    id: string;
    name: string;
    academicYearId: string;
    academicYear?: AcademicYear;
}

// ================= GRADING & ATTENDANCE =================
export interface Grade {
    id: string;
    score: number;
    feedback?: string | null;
    studentId: string;
    classId: string;
    termId: string;
    subjectId?: string | null;
    student?: Student;
    term?: Term;
    createdAt: string;
    updatedAt: string;
}

export interface Attendance {
    id: string;
    date: string;
    status: AttendanceStatus;
    studentId: string;
    classId: string;
    student?: Student;
}

// ================= LMS =================
export interface Assignment {
    id: string;
    title: string;
    description?: string | null;
    dueDate: string;
    maxScore: number;
    fileUrl?: string | null;
    fileType?: string | null;
    classId: string;
    class?: SchoolClass;
    submissions?: Submission[];
    createdAt: string;
}

export interface Submission {
    id: string;
    studentId: string;
    assignmentId: string;
    fileUrl?: string | null;
    content?: string | null;
    grade?: number | null;
    feedback?: string | null;
    submittedAt: string;
    gradedAt?: string | null;
    student?: Student;
    assignment?: Assignment;
}

export interface Quiz {
    id: string;
    title: string;
    description?: string | null;
    duration: number;
    passingScore: number;
    classId: string;
    questions?: Question[];
    createdAt: string;
}

export interface Question {
    id: string;
    text: string;
    points: number;
    type: QuestionType;
    quizId: string;
    options?: QuestionOption[];
}

export interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
    questionId: string;
}

export interface QuizAttempt {
    id: string;
    studentId: string;
    quizId: string;
    score: number;
    finishedAt: string;
    student?: Student;
    quiz?: Quiz;
}

// ================= FINANCE =================
export interface FeeStructure {
    id: string;
    name: string;
    amount: number;
    description?: string | null;
    dueDate?: string | null;
    academicYearId?: string | null;
}

export interface StudentFee {
    id: string;
    status: FeeStatus;
    studentId: string;
    feeStructureId: string;
    student?: Student;
    feeStructure?: FeeStructure;
    payments?: Payment[];
}

export interface Payment {
    id: string;
    amount: number;
    method: PaymentMethod;
    reference?: string | null;
    paidAt: string;
    studentFeeId: string;
}

// ================= COMMUNICATION =================
export interface Chat {
    id: string;
    message: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
    isRead: boolean;
    sender?: User;
    receiver?: User;
}

// ================= API RESPONSE TYPES =================
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    count?: number;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ================= FORM DATA TYPES =================
export interface CreateStudentData {
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    address?: string;
    guardianName?: string;
    guardianPhone?: string;
    password?: string;
}

export interface CreateTeacherData {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    password?: string;
}

export interface CreateClassData {
    name: string;
    teacherId?: string;
    subjectId?: string;
}

export interface CreateAssignmentData {
    title: string;
    description?: string;
    dueDate: string;
    maxScore: number;
}

export interface CreateQuizData {
    title: string;
    description?: string;
    duration: number;
    passingScore: number;
    questions: {
        text: string;
        points: number;
        type: QuestionType;
        options: {
            text: string;
            isCorrect: boolean;
        }[];
    }[];
}
