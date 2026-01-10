"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// Helper to generate JWT Token
const generateToken = (userId, role) => {
    // FIX: We added "|| '1d'" as a fallback and "as any" to bypass strict checking
    const secret = process.env.JWT_SECRET;
    const expiresIn = (process.env.JWT_EXPIRES_IN || '1d');
    return jsonwebtoken_1.default.sign({ userId, role }, secret, {
        expiresIn: expiresIn,
    });
};
const registerUser = async (data) => {
    // 1. Check if user already exists
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email },
    });
    if (existingUser) {
        throw new Error('User already exists');
    }
    // 2. Hash the password
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    // 3. Create the User and Profile
    const newUser = await prisma_1.default.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            role: data.role || 'STUDENT',
            ...(data.role === 'TEACHER' && {
                teacherProfile: {
                    create: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                    },
                },
            }),
            ...(data.role === 'STUDENT' || !data.role ? {
                studentProfile: {
                    create: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        dateOfBirth: new Date(),
                        gender: 'OTHER',
                    },
                },
            } : {}),
        },
    });
    // 4. Generate Token
    const token = generateToken(newUser.id, newUser.role);
    return { user: { id: newUser.id, email: newUser.email, role: newUser.role }, token };
};
exports.registerUser = registerUser;
const loginUser = async (data) => {
    // 1. Find User
    const user = await prisma_1.default.user.findUnique({
        where: { email: data.email },
    });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    // 2. Check Password
    const isMatch = await bcryptjs_1.default.compare(data.password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    // 3. Generate Token
    const token = generateToken(user.id, user.role);
    return { user: { id: user.id, email: user.email, role: user.role }, token };
};
exports.loginUser = loginUser;
