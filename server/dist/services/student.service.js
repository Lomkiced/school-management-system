"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStudents = getAllStudents;
exports.getStudentById = getStudentById;
exports.createStudent = createStudent;
exports.updateStudent = updateStudent;
exports.toggleStudentStatus = toggleStudentStatus;
exports.deleteStudentPermanently = deleteStudentPermanently;
exports.getStudentStats = getStudentStats;
// FILE: server/src/services/student.service.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// --- Read Operations ---
async function getAllStudents({ page = 1, limit = 10, search = '', status = 'ACTIVE' }) {
    const skip = (page - 1) * limit;
    // Build Dynamic Filter
    const whereClause = {
        AND: [
            status !== 'ALL' ? { user: { isActive: status === 'ACTIVE' } } : {},
            search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            } : {}
        ]
    };
    // Execute Queries
    const [total, students] = await prisma_1.default.$transaction([
        prisma_1.default.student.count({ where: whereClause }),
        prisma_1.default.student.findMany({
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
                enrollments: {
                    include: {
                        class: {
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
                        }
                    },
                    orderBy: { joinedAt: 'desc' },
                    take: 3 // Show last 3 enrollments
                },
                _count: {
                    select: {
                        enrollments: true,
                        grades: true
                    }
                }
            },
            orderBy: { lastName: 'asc' }
        })
    ]);
    return {
        data: students,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
async function getStudentById(id) {
    return await prisma_1.default.student.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    email: true,
                    isActive: true,
                    role: true
                }
            },
            enrollments: {
                include: {
                    class: {
                        include: {
                            subject: true,
                            teacher: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    joinedAt: 'desc'
                }
            },
            grades: {
                include: {
                    class: {
                        select: {
                            name: true
                        }
                    },
                    term: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            attendance: {
                orderBy: {
                    date: 'desc'
                },
                take: 10
            },
            studentFees: {
                include: {
                    feeStructure: true,
                    payments: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            submissions: {
                include: {
                    assignment: {
                        select: {
                            title: true,
                            dueDate: true
                        }
                    }
                },
                orderBy: {
                    submittedAt: 'desc'
                },
                take: 5
            }
        }
    });
}
// --- Write Operations ---
async function createStudent(data) {
    // Check if email already exists
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        throw new Error('Email already in use');
    }
    // Use provided password or fallback
    const passwordToHash = data.password || 'Student123';
    const hashedPassword = await bcryptjs_1.default.hash(passwordToHash, 10);
    return await prisma_1.default.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            role: client_1.UserRole.STUDENT,
            studentProfile: {
                create: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    gender: data.gender,
                    address: data.address || null,
                    guardianName: data.guardianName || null,
                    guardianPhone: data.guardianPhone || null
                }
            }
        },
        include: {
            studentProfile: true
        }
    });
}
async function updateStudent(id, data) {
    // Verify student exists
    const student = await prisma_1.default.student.findUnique({
        where: { id }
    });
    if (!student) {
        throw new Error('Student not found');
    }
    return await prisma_1.default.student.update({
        where: { id },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            gender: data.gender,
            address: data.address,
            guardianName: data.guardianName,
            guardianPhone: data.guardianPhone
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
// === TOGGLE STATUS (Soft Delete) ===
async function toggleStudentStatus(id) {
    const student = await prisma_1.default.student.findUnique({
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
    if (!student) {
        throw new Error("Student not found");
    }
    return await prisma_1.default.user.update({
        where: { id: student.userId },
        data: { isActive: !student.user.isActive }
    });
}
// === PERMANENT DELETE (Hard Delete) ===
async function deleteStudentPermanently(id) {
    const student = await prisma_1.default.student.findUnique({
        where: { id },
        select: {
            id: true,
            userId: true
        }
    });
    if (!student) {
        throw new Error("Student not found");
    }
    // TRANSACTION: Delete everything in correct order
    return await prisma_1.default.$transaction([
        // 1. Delete Quiz Attempts and Answers
        prisma_1.default.quizAnswer.deleteMany({
            where: {
                attempt: {
                    studentId: id
                }
            }
        }),
        prisma_1.default.quizAttempt.deleteMany({
            where: { studentId: id }
        }),
        // 2. Delete Submissions
        prisma_1.default.submission.deleteMany({
            where: { studentId: id }
        }),
        // 3. Delete Grades
        prisma_1.default.grade.deleteMany({
            where: { studentId: id }
        }),
        // 4. Delete Attendance Records
        prisma_1.default.attendance.deleteMany({
            where: { studentId: id }
        }),
        // 5. Delete Enrollments
        prisma_1.default.enrollment.deleteMany({
            where: { studentId: id }
        }),
        // 6. Delete Payments first (foreign key to StudentFee)
        prisma_1.default.payment.deleteMany({
            where: {
                studentFee: {
                    studentId: id
                }
            }
        }),
        // 7. Delete Student Fees
        prisma_1.default.studentFee.deleteMany({
            where: { studentId: id }
        }),
        // 8. Delete the Student Profile
        prisma_1.default.student.delete({
            where: { id }
        }),
        // 9. Finally, Delete the User Account
        prisma_1.default.user.delete({
            where: { id: student.userId }
        })
    ]);
}
/**
 * Get student statistics
 */
async function getStudentStats(id) {
    const student = await prisma_1.default.student.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    enrollments: true,
                    grades: true,
                    attendance: true,
                    submissions: true
                }
            },
            grades: {
                select: {
                    score: true
                }
            },
            attendance: {
                select: {
                    status: true
                }
            }
        }
    });
    if (!student) {
        throw new Error('Student not found');
    }
    // Calculate statistics
    const totalGrades = student.grades.length;
    const averageGrade = totalGrades > 0
        ? student.grades.reduce((sum, g) => sum + g.score, 0) / totalGrades
        : 0;
    const totalAttendance = student.attendance.length;
    const presentCount = student.attendance.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = totalAttendance > 0
        ? (presentCount / totalAttendance) * 100
        : 0;
    return {
        totalEnrollments: student._count.enrollments,
        totalGrades: student._count.grades,
        averageGrade: Number(averageGrade.toFixed(2)),
        totalAttendance: student._count.attendance,
        attendanceRate: Number(attendanceRate.toFixed(2)),
        totalSubmissions: student._count.submissions
    };
}
