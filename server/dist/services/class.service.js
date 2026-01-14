"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllClasses = getAllClasses;
exports.getClassById = getClassById;
exports.createClass = createClass;
exports.updateClass = updateClass;
exports.deleteClass = deleteClass;
exports.enrollStudent = enrollStudent;
exports.unenrollStudent = unenrollStudent;
exports.getClassStudents = getClassStudents;
exports.getFormOptions = getFormOptions;
exports.getClassStats = getClassStats;
// FILE: server/src/services/class.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get all classes with their related data
 */
async function getAllClasses() {
    return await prisma_1.default.class.findMany({
        include: {
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true
                }
            },
            subject: {
                select: {
                    id: true,
                    name: true,
                    code: true
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
                    enrollments: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });
}
/**
 * Get a single class by ID with all related data
 */
async function getClassById(id) {
    return await prisma_1.default.class.findUnique({
        where: { id },
        include: {
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    address: true
                }
            },
            subject: {
                select: {
                    id: true,
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
                            lastName: true,
                            gender: true,
                            dateOfBirth: true
                        }
                    }
                },
                orderBy: {
                    student: {
                        lastName: 'asc'
                    }
                }
            },
            grades: {
                include: {
                    student: true,
                    term: true
                }
            },
            attendance: {
                include: {
                    student: true
                },
                orderBy: {
                    date: 'desc'
                }
            }
        }
    });
}
/**
 * Create a new class
 */
async function createClass(data) {
    return await prisma_1.default.class.create({
        data: {
            name: data.name,
            teacherId: data.teacherId || null,
            subjectId: data.subjectId || null,
        },
        include: {
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            subject: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });
}
/**
 * Update an existing class
 */
async function updateClass(id, data) {
    return await prisma_1.default.class.update({
        where: { id },
        data: {
            name: data.name,
            teacherId: data.teacherId || null,
            subjectId: data.subjectId || null,
        },
        include: {
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            subject: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });
}
/**
 * Delete a class
 */
async function deleteClass(id) {
    return await prisma_1.default.class.delete({
        where: { id }
    });
}
/**
 * Enroll a student in a class
 */
async function enrollStudent(classId, studentId) {
    // Check if class exists
    const classExists = await prisma_1.default.class.findUnique({
        where: { id: classId }
    });
    if (!classExists) {
        throw new Error("Class not found");
    }
    // Check if student exists
    const studentExists = await prisma_1.default.student.findUnique({
        where: { id: studentId }
    });
    if (!studentExists) {
        throw new Error("Student not found");
    }
    // Check if already enrolled
    const existing = await prisma_1.default.enrollment.findUnique({
        where: {
            studentId_classId: {
                studentId: studentId,
                classId: classId
            }
        }
    });
    if (existing) {
        throw new Error("Student is already enrolled in this class");
    }
    // Create enrollment
    return await prisma_1.default.enrollment.create({
        data: {
            studentId: studentId,
            classId: classId
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gender: true
                }
            },
            class: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
}
/**
 * Remove a student from a class
 */
async function unenrollStudent(classId, studentId) {
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: {
            studentId_classId: {
                studentId: studentId,
                classId: classId
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
 * Get students enrolled in a specific class
 */
async function getClassStudents(classId) {
    const enrollments = await prisma_1.default.enrollment.findMany({
        where: { classId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gender: true,
                    dateOfBirth: true,
                    address: true,
                    guardianName: true,
                    guardianPhone: true
                }
            }
        },
        orderBy: {
            student: {
                lastName: 'asc'
            }
        }
    });
    return enrollments.map(e => e.student);
}
/**
 * Get form options for creating/updating classes
 */
async function getFormOptions() {
    const [teachers, subjects] = await Promise.all([
        prisma_1.default.teacher.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
            },
            orderBy: {
                lastName: 'asc'
            }
        }),
        prisma_1.default.subject.findMany({
            select: {
                id: true,
                name: true,
                code: true,
                description: true
            },
            orderBy: {
                name: 'asc'
            }
        })
    ]);
    return { teachers, subjects };
}
/**
 * Get class statistics
 */
async function getClassStats(classId) {
    const classData = await prisma_1.default.class.findUnique({
        where: { id: classId },
        include: {
            _count: {
                select: {
                    enrollments: true,
                    grades: true,
                    attendance: true
                }
            }
        }
    });
    if (!classData) {
        throw new Error("Class not found");
    }
    // Calculate average grade
    const grades = await prisma_1.default.grade.findMany({
        where: { classId },
        select: { score: true }
    });
    const averageGrade = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
        : 0;
    // Calculate attendance rate
    const attendanceRecords = await prisma_1.default.attendance.findMany({
        where: { classId },
        select: { status: true }
    });
    const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = attendanceRecords.length > 0
        ? (presentCount / attendanceRecords.length) * 100
        : 0;
    return {
        totalStudents: classData._count.enrollments,
        totalGrades: classData._count.grades,
        totalAttendance: classData._count.attendance,
        averageGrade: Number(averageGrade.toFixed(2)),
        attendanceRate: Number(attendanceRate.toFixed(2))
    };
}
