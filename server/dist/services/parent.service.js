"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteParent = exports.linkStudentsToParent = exports.updateParent = exports.createParent = exports.getAllParents = void 0;
// FILE: server/src/services/parent.service.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const getAllParents = async ({ page = 1, limit = 10, search = '' }) => {
    const skip = (page - 1) * limit;
    const whereClause = search ? {
        OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { phone: { contains: search, mode: 'insensitive' } }
        ]
    } : {};
    const [total, parents] = await prisma_1.default.$transaction([
        prisma_1.default.parent.count({ where: whereClause }),
        prisma_1.default.parent.findMany({
            where: whereClause,
            take: limit,
            skip: skip,
            include: {
                user: { select: { email: true, isActive: true } },
                students: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            orderBy: { lastName: 'asc' }
        })
    ]);
    return {
        data: parents,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
};
exports.getAllParents = getAllParents;
const createParent = async (data) => {
    const existingUser = await prisma_1.default.user.findUnique({ where: { email: data.email } });
    if (existingUser)
        throw new Error('Email already in use');
    const password = data.password || 'Parent123';
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    return await prisma_1.default.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role: client_1.UserRole.PARENT,
                isActive: true
            }
        });
        return await tx.parent.create({
            data: {
                userId: newUser.id,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                address: data.address,
                // REMOVED: relationship field (Not in your DB schema)
            }
        });
    });
};
exports.createParent = createParent;
const updateParent = async (id, data) => {
    return await prisma_1.default.parent.update({
        where: { id },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            address: data.address,
            // REMOVED: relationship field
        }
    });
};
exports.updateParent = updateParent;
// === LINKING LOGIC ===
const linkStudentsToParent = async (parentId, studentIds) => {
    // We update the students to point to this parent
    return await prisma_1.default.student.updateMany({
        where: { id: { in: studentIds } },
        data: { parentId: parentId }
    });
};
exports.linkStudentsToParent = linkStudentsToParent;
const deleteParent = async (id) => {
    const parent = await prisma_1.default.parent.findUnique({ where: { id }, select: { userId: true } });
    if (!parent)
        throw new Error("Parent not found");
    // Unlink children first (don't delete the kids!)
    await prisma_1.default.student.updateMany({
        where: { parentId: id },
        data: { parentId: null }
    });
    return await prisma_1.default.user.delete({ where: { id: parent.userId } });
};
exports.deleteParent = deleteParent;
