// FILE: server/src/controllers/parent-portal.controller.ts
// 2026 Standard: Parent portal with child tracking

import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Get parent dashboard data with all linked children
 */
export async function getParentDashboard(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const parent = await prisma.parent.findUnique({
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
            totalEnrollments: parent.students.reduce((sum: number, s: any) => sum + s._count.enrollments, 0),
            averageAttendance: 0,
            recentGradesAvg: 0
        };

        // Calculate average attendance
        let totalAttendance = 0;
        let attendanceCount = 0;
        parent.students.forEach((student: any) => {
            const presentCount = student.attendance.filter((a: any) => a.status === 'PRESENT').length;
            if (student.attendance.length > 0) {
                totalAttendance += (presentCount / student.attendance.length) * 100;
                attendanceCount++;
            }
        });
        stats.averageAttendance = attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 0;

        // Calculate recent grades average
        let gradesSum = 0;
        let gradesCount = 0;
        parent.students.forEach((student: any) => {
            student.grades.forEach((grade: any) => {
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

    } catch (error: any) {
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
export async function getChildDetails(req: Request, res: Response) {
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
        const parent = await prisma.parent.findUnique({
            where: { userId },
            select: { id: true }
        });

        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent profile not found'
            });
        }

        const student = await prisma.student.findFirst({
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

    } catch (error: any) {
        console.error('Get child details error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to load child details'
        });
    }
}

export const ParentPortalController = {
    getParentDashboard,
    getChildDetails
};
