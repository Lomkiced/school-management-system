"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollStudentBulk = enrollStudentBulk;
exports.getEnrollmentsByClass = getEnrollmentsByClass;
exports.getEnrollmentsByStudent = getEnrollmentsByStudent;
exports.getEnrollmentOptions = getEnrollmentOptions;
exports.unenrollStudent = unenrollStudent;
exports.getEnrollmentStats = getEnrollmentStats;
exports.transferStudent = transferStudent;
// FILE: server/src/services/enrollment.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Enroll multiple students in a class (bulk enrollment)
 */
async function enrollStudentBulk(classId, studentIds) {
    // 1. Validate Class Exists
    const classExists = await prisma_1.default.class.findUnique({
        where: { id: classId },
        include: {
            teacher: true,
            subject: true
        }
    });
    if (!classExists) {
        throw new Error("Class not found");
    }
    // 2. Filter Duplicates: Find students ALREADY in this class
    const existingEnrollments = await prisma_1.default.enrollment.findMany({
        where: {
            classId: classId,
            studentId: { in: studentIds }
        },
        select: { studentId: true }
    });
    const alreadyEnrolledIds = new Set(existingEnrollments.map(e => e.studentId));
    // 3. Determine who needs to be added
    const newStudentIds = studentIds.filter(id => !alreadyEnrolledIds.has(id));
    if (newStudentIds.length === 0) {
        return {
            added: 0,
            skipped: studentIds.length,
            message: "No new enrollments. All selected students are already in this class."
        };
    }
    // 4. Bulk Insert
    await prisma_1.default.enrollment.createMany({
        data: newStudentIds.map(studentId => ({
            classId,
            studentId
        }))
    });
    return {
        added: newStudentIds.length,
        skipped: alreadyEnrolledIds.size,
        message: `Successfully enrolled ${newStudentIds.length} student(s).`
    };
}
/**
 * Get all enrollments for a specific class
 */
async function getEnrollmentsByClass(classId) {
    return await prisma_1.default.enrollment.findMany({
        where: { classId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gender: true,
                    dateOfBirth: true,
                    guardianName: true,
                    guardianPhone: true,
                    user: {
                        select: {
                            email: true,
                            isActive: true
                        }
                    }
                }
            },
            class: {
                select: {
                    id: true,
                    name: true,
                    teacher: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    subject: {
                        select: {
                            name: true,
                            code: true
                        }
                    }
                }
            }
        },
        orderBy: {
            student: {
                lastName: 'asc'
            }
        }
    });
}
/**
 * Get all enrollments for a specific student
 */
async function getEnrollmentsByStudent(studentId) {
    return await prisma_1.default.enrollment.findMany({
        where: { studentId },
        include: {
            class: {
                select: {
                    id: true,
                    name: true,
                    teacher: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    subject: {
                        select: {
                            name: true,
                            code: true,
                            description: true
                        }
                    }
                }
            }
        },
        orderBy: {
            joinedAt: 'desc'
        }
    });
}
/**
 * Get options for enrollment forms (students and classes)
 */
async function getEnrollmentOptions() {
    // 1. Fetch Active Students with their current enrollments
    const students = await prisma_1.default.student.findMany({
        where: {
            user: {
                isActive: true
            }
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            user: {
                select: {
                    email: true,
                    isActive: true
                }
            },
            enrollments: {
                select: {
                    id: true,
                    classId: true,
                    joinedAt: true,
                    class: {
                        select: {
                            name: true,
                            subject: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    joinedAt: 'desc'
                }
            },
            _count: {
                select: {
                    enrollments: true
                }
            }
        },
        orderBy: {
            lastName: 'asc'
        }
    });
    // 2. Fetch Classes with details
    const classes = await prisma_1.default.class.findMany({
        include: {
            teacher: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
            subject: {
                select: {
                    name: true,
                    code: true
                }
            },
            _count: {
                select: {
                    enrollments: true
                }
            }
        },
        orderBy: [
            { name: 'asc' }
        ]
    });
    return { students, classes };
}
/**
 * Remove a student from a class
 */
async function unenrollStudent(classId, studentId) {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: {
            studentId_classId: {
                studentId,
                classId
            }
        }
    });
    if (!enrollment) {
        throw new Error("Student is not enrolled in this class");
    }
    return await prisma_1.default.enrollment.delete({
        where: {
            id: enrollment.id
        }
    });
}
/**
 * Get enrollment statistics
 */
async function getEnrollmentStats() {
    // Total enrollments
    const totalEnrollments = await prisma_1.default.enrollment.count();
    // Enrollments by class
    const enrollmentsByClass = await prisma_1.default.class.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    enrollments: true
                }
            }
        },
        orderBy: {
            enrollments: {
                _count: 'desc'
            }
        },
        take: 10 // Top 10 classes
    });
    // Total students enrolled
    const studentsEnrolled = await prisma_1.default.student.count({
        where: {
            enrollments: {
                some: {}
            }
        }
    });
    // Students not enrolled in any class
    const studentsNotEnrolled = await prisma_1.default.student.count({
        where: {
            enrollments: {
                none: {}
            }
        }
    });
    return {
        totalEnrollments,
        studentsEnrolled,
        studentsNotEnrolled,
        topClasses: enrollmentsByClass
    };
}
/**
 * Transfer a student from one class to another
 */
async function transferStudent(studentId, fromClassId, toClassId) {
    // Validate both classes exist
    const [fromClass, toClass] = await Promise.all([
        prisma_1.default.class.findUnique({ where: { id: fromClassId } }),
        prisma_1.default.class.findUnique({ where: { id: toClassId } })
    ]);
    if (!fromClass) {
        throw new Error("Source class not found");
    }
    if (!toClass) {
        throw new Error("Destination class not found");
    }
    // Check if student is enrolled in source class
    const currentEnrollment = await prisma_1.default.enrollment.findUnique({
        where: {
            studentId_classId: {
                studentId,
                classId: fromClassId
            }
        }
    });
    if (!currentEnrollment) {
        throw new Error("Student is not enrolled in the source class");
    }
    // Check if already enrolled in destination class
    const existingEnrollment = await prisma_1.default.enrollment.findUnique({
        where: {
            studentId_classId: {
                studentId,
                classId: toClassId
            }
        }
    });
    if (existingEnrollment) {
        throw new Error("Student is already enrolled in the destination class");
    }
    // Perform transfer in a transaction
    const result = await prisma_1.default.$transaction([
        // Remove from old class
        prisma_1.default.enrollment.delete({
            where: { id: currentEnrollment.id }
        }),
        // Add to new class
        prisma_1.default.enrollment.create({
            data: {
                studentId,
                classId: toClassId
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                class: {
                    select: {
                        name: true
                    }
                }
            }
        })
    ]);
    return result[1]; // Return the new enrollment
}
