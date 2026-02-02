"use strict";
// FILE: server/src/controllers/parent-portal.controller.ts
// 2026 Standard: Parent portal with child tracking
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentPortalController = void 0;
exports.getParentDashboard = getParentDashboard;
exports.getChildDetails = getChildDetails;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get parent dashboard data with all linked children
 */
async function getParentDashboard(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const parent = await prisma_1.default.parent.findUnique({
            where: { userId },
            include: {
                students: {
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
                            },
                            take: 10
                        },
                        attendance: {
                            orderBy: {
                                date: 'desc'
                            },
                            take: 30
                        },
                        _count: {
                            select: {
                                enrollments: true,
                                grades: true,
                                attendance: true
                            }
                        }
                    }
                }
            }
        });
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent profile not found'
            });
        }
        // Calculate statistics
        const stats = {
            totalChildren: parent.students.length,
            totalEnrollments: parent.students.reduce((sum, s) => sum + s._count.enrollments, 0),
            averageAttendance: 0,
            recentGradesAvg: 0
        };
        // Calculate average attendance
        let totalAttendance = 0;
        let attendanceCount = 0;
        parent.students.forEach((student) => {
            const presentCount = student.attendance.filter((a) => a.status === 'PRESENT').length;
            if (student.attendance.length > 0) {
                totalAttendance += (presentCount / student.attendance.length) * 100;
                attendanceCount++;
            }
        });
        stats.averageAttendance = attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 0;
        // Calculate recent grades average
        let gradesSum = 0;
        let gradesCount = 0;
        parent.students.forEach((student) => {
            student.grades.forEach((grade) => {
                gradesSum += grade.score;
                gradesCount++;
            });
        });
        stats.recentGradesAvg = gradesCount > 0 ? Math.round(gradesSum / gradesCount) : 0;
        res.json({
            success: true,
            data: {
                children: parent.students,
                stats
            }
        });
    }
    catch (error) {
        console.error('Parent dashboard error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to load dashboard'
        });
    }
}
/**
 * Get detailed information for a specific child
 */
async function getChildDetails(req, res) {
    try {
        const userId = req.user?.id;
        const { studentId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Verify parent has access to this student
        const parent = await prisma_1.default.parent.findUnique({
            where: { userId },
            select: { id: true }
        });
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent profile not found'
            });
        }
        const student = await prisma_1.default.student.findFirst({
            where: {
                id: studentId,
                parentId: parent.id
            },
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
                    include: {
                        class: {
                            select: {
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        date: 'desc'
                    },
                    take: 50
                }
            }
        });
        if (!student) {
            return res.status(403).json({
                success: false,
                message: 'Access denied or student not found'
            });
        }
        res.json({
            success: true,
            data: student
        });
    }
    catch (error) {
        console.error('Get child details error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to load child details'
        });
    }
}
exports.ParentPortalController = {
    getParentDashboard,
    getChildDetails
};
