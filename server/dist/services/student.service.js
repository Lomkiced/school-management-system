"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentById = exports.createStudent = exports.getAllStudents = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const getAllStudents = async () => {
    return await prisma_1.default.student.findMany({
        include: {
            user: {
                select: { email: true, isActive: true }
            },
            // NEW: Fetch their section enrollments
            enrollments: {
                include: {
                    section: true
                },
                orderBy: { joinedAt: 'desc' }, // Get latest first
                take: 1
            }
        },
        orderBy: { lastName: 'asc' }
    });
};
exports.getAllStudents = getAllStudents;
const createStudent = async (data) => {
    // 1. Check if email exists
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser)
        throw new Error('Email already in use');
    // 2. Hash default password (e.g., "Student123")
    // In a real app, you might auto-generate this and email it to them
    const hashedPassword = await bcryptjs_1.default.hash('Student123', 10);
    // 3. Transaction: Create User AND Student Profile together
    const newStudent = await prisma_1.default.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            role: client_1.UserRole.STUDENT,
            studentProfile: {
                create: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    dateOfBirth: new Date(data.dateOfBirth),
                    gender: data.gender,
                    address: data.address,
                    guardianName: data.guardianName,
                    guardianPhone: data.guardianPhone
                }
            }
        },
        include: {
            studentProfile: true
        }
    });
    return newStudent;
};
exports.createStudent = createStudent;
const getStudentById = async (id) => {
    return await prisma_1.default.student.findUnique({
        where: { id },
        include: { user: { select: { email: true } } }
    });
};
exports.getStudentById = getStudentById;
