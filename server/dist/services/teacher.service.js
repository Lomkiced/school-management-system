"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeacher = exports.getAllTeachers = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const getAllTeachers = async () => {
    return await prisma_1.default.teacher.findMany({
        include: {
            user: {
                select: { email: true, isActive: true }
            }
        },
        orderBy: { lastName: 'asc' }
    });
};
exports.getAllTeachers = getAllTeachers;
const createTeacher = async (data) => {
    // Check email
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser)
        throw new Error('Email already in use');
    // Default password for teachers
    const hashedPassword = await bcryptjs_1.default.hash('Teacher123', 10);
    // Create User + Teacher Profile
    const newTeacher = await prisma_1.default.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            role: client_1.UserRole.TEACHER,
            teacherProfile: {
                create: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    address: data.address
                }
            }
        },
        include: {
            teacherProfile: true
        }
    });
    return newTeacher;
};
exports.createTeacher = createTeacher;
