"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTeachers = getAllTeachers;
exports.getTeacherById = getTeacherById;
exports.createTeacher = createTeacher;
exports.updateTeacher = updateTeacher;
exports.toggleTeacherStatus = toggleTeacherStatus;
exports.deleteTeacher = deleteTeacher;
exports.getTeacherStats = getTeacherStats;
// FILE: server/src/services/teacher.service.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// --- Read Operations ---
async function getAllTeachers({ page = 1, limit = 10, search = '', status = 'ACTIVE', departmentId, assignmentStatus = 'all' }) {
    const skip = (page - 1) * limit;
    // Build Filter
    const whereClause = {
        AND: [
            status !== 'ALL' ? { user: { isActive: status === 'ACTIVE' } } : {},
            // Department filter logic:
            // - If departmentId is 'null', show teachers with no department
            // - Otherwise filter by specific department
            departmentId ? { departmentId: departmentId === 'null' ? null : departmentId } : {},
            search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            } : {},
            // NEW: Assignment status filter
            assignmentStatus === 'unassigned' ? { classes: { none: {} } } : {},
            assignmentStatus === 'assigned' ? { classes: { some: {} } } : {}
        ]
    };
    // Parallel Fetch (Data + Count)
    const [total, teachers] = await prisma_1.default.$transaction([
        prisma_1.default.teacher.count({ where: whereClause }),
        prisma_1.default.teacher.findMany({
            where: whereClause,
            take: limit,
            skip: skip,
            include: {
                user: {
                    select: {
                        email: true,
                        isActive: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                classes: {
                    select: {
                        id: true,
                        name: true,
                        subject: {
                            select: {
                                name: true,
                                code: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        classes: true
                    }
                }
            },
            orderBy: { lastName: 'asc' }
        })
    ]);
    return {
        data: teachers,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
async function getTeacherById(id) {
    return await prisma_1.default.teacher.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    email: true,
                    role: true,
                    isActive: true
                }
            },
            classes: {
                include: {
                    subject: {
                        select: {
                            name: true,
                            code: true,
                            description: true
                        }
                    },
                    enrollments: {
                        include: {
                            student: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            grades: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            },
            _count: {
                select: {
                    classes: true
                }
            }
        }
    });
}
// --- Write Operations ---
async function createTeacher(data) {
    // Check if email already exists
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        throw new Error('Email already in use');
    }
    // Use provided password or fallback
    const passwordToHash = data.password || 'Teacher123';
    const hashedPassword = await bcryptjs_1.default.hash(passwordToHash, 10);
    return await prisma_1.default.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role: client_1.UserRole.TEACHER,
                isActive: true
            }
        });
        const newTeacherProfile = await tx.teacher.create({
            data: {
                userId: newUser.id,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone || null,
                address: data.address || null,
                specialization: data.specialization || null,
                departmentId: data.departmentId || null
            }
        });
        return {
            ...newTeacherProfile,
            email: newUser.email
        };
    });
}
async function updateTeacher(id, data) {
    // Verify teacher exists
    const teacher = await prisma_1.default.teacher.findUnique({
        where: { id }
    });
    if (!teacher) {
        throw new Error('Teacher not found');
    }
    return await prisma_1.default.teacher.update({
        where: { id },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            address: data.address,
            specialization: data.specialization,
            departmentId: data.departmentId
        },
        include: {
            user: {
                select: {
                    email: true,
                    isActive: true
                }
            }
        }
    });
}
// === TOGGLE STATUS ===
async function toggleTeacherStatus(id) {
    const teacher = await prisma_1.default.teacher.findUnique({
        where: { id },
        select: {
            userId: true,
            user: {
                select: {
                    isActive: true
                }
            }
        }
    });
    if (!teacher) {
        throw new Error("Teacher not found");
    }
    // Flip the status
    return await prisma_1.default.user.update({
        where: { id: teacher.userId },
        data: { isActive: !teacher.user.isActive }
    });
}
// === DELETE TEACHER ===
async function deleteTeacher(id) {
    const teacher = await prisma_1.default.teacher.findUnique({
        where: { id },
        select: {
            userId: true,
            _count: {
                select: {
                    classes: true
                }
            }
        }
    });
    if (!teacher) {
        throw new Error('Teacher not found');
    }
    if (teacher._count.classes > 0) {
        throw new Error('Cannot delete teacher with assigned classes. Please reassign classes first.');
    }
    // Delete teacher profile and user account
    return await prisma_1.default.$transaction([
        prisma_1.default.teacher.delete({ where: { id } }),
        prisma_1.default.user.delete({ where: { id: teacher.userId } })
    ]);
}
/**
 * Get teacher statistics
 */
async function getTeacherStats(id) {
    const teacher = await prisma_1.default.teacher.findUnique({
        where: { id },
        include: {
            classes: {
                include: {
                    _count: {
                        select: {
                            enrollments: true,
                            grades: true
                        }
                    }
                }
            }
        }
    });
    if (!teacher) {
        throw new Error('Teacher not found');
    }
    const totalClasses = teacher.classes.length;
    const totalStudents = teacher.classes.reduce((sum, cls) => sum + cls._count.enrollments, 0);
    const totalGradesGiven = teacher.classes.reduce((sum, cls) => sum + cls._count.grades, 0);
    return {
        totalClasses,
        totalStudents,
        totalGradesGiven
    };
}
