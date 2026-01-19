// FILE: server/src/controllers/portal.controller.ts
// 2026 Standard: Student portal controller with LMS support

import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Get student's enrolled classes (for LMS)
 */
export async function getMyClasses(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please log in'
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                teacher: {
                  select: {
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
                },
                _count: {
                  select: {
                    enrollments: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    res.json({
      success: true,
      data: student.enrollments,
      count: student.enrollments.length
    });

  } catch (error: any) {
    console.error('Get my classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch classes'
    });
  }
}

/**
 * Get class info for student
 */
export async function getClassInfo(req: Request, res: Response) {
  try {
    const { classId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!classId || classId.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
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
      }
    });

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: classInfo
    });

  } catch (error: any) {
    console.error('Get class info error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch class info'
    });
  }
}

/**
 * Get student dashboard data
 */
export async function getStudentDashboard(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true }
        },
        enrollments: {
          include: {
            class: {
              include: {
                subject: true
              }
            }
          }
        },
        grades: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const totalClasses = student.enrollments.length;
    const averageGrade = student.grades.length > 0
      ? (student.grades.reduce((sum, g) => sum + g.score, 0) / student.grades.length).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        studentInfo: {
          name: `${student.firstName} ${student.lastName}`,
          email: student.user.email,
          id: student.id
        },
        stats: {
          totalClasses,
          averageGrade,
          recentGrades: student.grades.length
        },
        enrollments: student.enrollments,
        recentGrades: student.grades
      }
    });

  } catch (error: any) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard'
    });
  }
}

/**
 * Get grades for the authenticated student
 */
export async function getMyGrades(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please log in"
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        grades: {
          include: {
            class: {
              include: {
                subject: true,
                teacher: true
              }
            },
            term: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const reportCard = student.grades.map(g => ({
      id: g.id,
      subject: g.class.subject?.name || 'N/A',
      code: g.class.subject?.code || 'N/A',
      className: g.class.name,
      teacher: g.class.teacher
        ? `${g.class.teacher.lastName}, ${g.class.teacher.firstName}`
        : 'No Teacher Assigned',
      term: g.term.name,
      score: g.score,
      feedback: g.feedback,
      gradedAt: g.updatedAt
    }));

    res.json({
      success: true,
      data: reportCard,
      studentInfo: {
        name: `${student.firstName} ${student.lastName}`,
        studentId: student.id
      }
    });

  } catch (error: any) {
    console.error('Get grades error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch grades'
    });
  }
}