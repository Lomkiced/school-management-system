"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStudents = getAllStudents;
exports.getStudentById = getStudentById;
exports.getUnenrolledStudents = getUnenrolledStudents;
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
// ... existing code ...
async function getStudentById(id) {
    // ... existing implementation ...
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
async function getUnenrolledStudents() {
    return await prisma_1.default.student.findMany({
        where: {
            enrollments: {
                none: {}
            }
        },
        include: {
            user: {
                select: {
                    email: true,
                    isActive: true
                }
            }
        },
        orderBy: { lastName: 'asc' }
    });
}
// --- Write Operations ---
async function createStudent(data) {
    // Check if student email already exists
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        throw new Error('Student email already in use');
    }
    // Use provided password or fallback
    const studentPassword = data.password || 'Student123';
    const hashedStudentPassword = await bcryptjs_1.default.hash(studentPassword, 10);
    // Check if we need to create or link parent
    let parentId = null;
    if (data.createParent && data.parentEmail) {
        // Check if parent with this email already exists
        const existingParent = await prisma_1.default.user.findUnique({
            where: { email: data.parentEmail },
            include: { parentProfile: true }
        });
        if (existingParent) {
            // Parent exists - link to them (sibling scenario)
            if (existingParent.parentProfile) {
                parentId = existingParent.parentProfile.id;
            }
            else {
                throw new Error('This email belongs to a non-parent account');
            }
        }
        else {
            // Create new parent account
            const parentPassword = data.parentPassword || 'Parent123';
            const hashedParentPassword = await bcryptjs_1.default.hash(parentPassword, 10);
            const newParentUser = await prisma_1.default.user.create({
                data: {
                    email: data.parentEmail,
                    password: hashedParentPassword,
                    role: client_1.UserRole.PARENT,
                    isActive: true,
                    parentProfile: {
                        create: {
                            firstName: data.parentFirstName || data.guardianName?.split(' ')[0] || 'Parent',
                            lastName: data.parentLastName || data.guardianName?.split(' ').slice(1).join(' ') || data.lastName,
                            phone: data.guardianPhone || null,
                            address: data.address || null
                        }
                    }
                },
                include: { parentProfile: true }
            });
            parentId = newParentUser.parentProfile.id;
        }
    }
    else if (data.existingParentId) {
        // Link to an explicitly selected existing parent
        parentId = data.existingParentId;
    }
    // Create student with optional parent link
    return await prisma_1.default.user.create({
        data: {
            email: data.email,
            password: hashedStudentPassword,
            role: client_1.UserRole.STUDENT,
            studentProfile: {
                create: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    gender: data.gender,
                    address: data.address || null,
                    guardianName: data.guardianName || null,
                    guardianPhone: data.guardianPhone || null,
                    gradeLevel: data.gradeLevel || 1,
                    parentId: parentId
                }
            }
        },
        include: {
            studentProfile: {
                include: {
                    parent: {
                        include: {
                            user: { select: { email: true } }
                        }
                    }
                }
            }
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
    // Prepare update data
    const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        address: data.address,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone
    };
    // If password is provided, update the linked User account
    if (data.password) {
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        // We need to update the User model, which is a relation
        // We can do this via nested update in Prisma if we select the user
        // But commonly better to do separate or transaction if complex. 
        // Here we can use nested update since standard relation.
        await prisma_1.default.user.update({
            where: { id: student.userId },
            data: { password: hashedPassword }
        });
    }
    return await prisma_1.default.student.update({
        where: { id },
        data: updateData,
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
