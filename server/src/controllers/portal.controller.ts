// FILE: server/src/controllers/portal.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Get grades for the authenticated student
 */
export async function getMyGrades(req: Request, res: Response) {
  try {
    // Get user ID from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - Please log in" 
      });
    }

    // Find student profile
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

    // Transform data for the report card with null safety
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

/**
 * Get student's class schedule
 */
export async function getMySchedule(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                subject: true,
                teacher: true
              }
            }
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

    const schedule = student.enrollments.map(e => ({
      classId: e.class.id,
      className: e.class.name,
      subject: e.class.subject?.name || 'N/A',
      subjectCode: e.class.subject?.code || 'N/A',
      teacher: e.class.teacher
        ? `${e.class.teacher.firstName} ${e.class.teacher.lastName}`
        : 'No Teacher Assigned',
      enrolledAt: e.joinedAt
    }));

    res.json({ 
      success: true, 
      data: schedule 
    });

  } catch (error: any) {
    console.error('Get schedule error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch schedule'
    });
  }
}

/**
 * Get student's attendance records
 */
export async function getMyAttendance(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student profile not found" 
      });
    }

    const attendance = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: {
        class: {
          select: {
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
      orderBy: {
        date: 'desc'
      }
    });

    const attendanceRecords = attendance.map(a => ({
      id: a.id,
      date: a.date,
      status: a.status,
      className: a.class.name,
      subject: a.class.subject?.name || 'N/A'
    }));

    // Calculate attendance statistics
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
    const lateCount = attendance.filter(a => a.status === 'LATE').length;
    const excusedCount = attendance.filter(a => a.status === 'EXCUSED').length;

    const attendanceRate = totalRecords > 0 
      ? ((presentCount / totalRecords) * 100).toFixed(2)
      : '0.00';

    res.json({ 
      success: true, 
      data: attendanceRecords,
      statistics: {
        total: totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendanceRate: `${attendanceRate}%`
      }
    });

  } catch (error: any) {
    console.error('Get attendance error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch attendance'
    });
  }
}

/**
 * Get student's assignments
 */
export async function getMyAssignments(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    // First get student ID
    const studentProfile = await prisma.student.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!studentProfile) {
      return res.status(404).json({ 
        success: false, 
        message: "Student profile not found" 
      });
    }

    // Then get student with assignments
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                assignments: {
                  include: {
                    submissions: {
                      where: {
                        studentId: studentProfile.id
                      }
                    }
                  },
                  orderBy: {
                    dueDate: 'desc'
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
        message: "Student profile not found" 
      });
    }

    // Flatten assignments from all enrolled classes
    const assignments = student.enrollments.flatMap((enrollment: any) =>
      enrollment.class.assignments.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        className: enrollment.class.name,
        submitted: assignment.submissions.length > 0,
        submission: assignment.submissions[0] || null,
        grade: assignment.submissions[0]?.grade || null,
        feedback: assignment.submissions[0]?.feedback || null
      }))
    );

    res.json({ 
      success: true, 
      data: assignments 
    });

  } catch (error: any) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch assignments'
    });
  }
}

/**
 * Get student dashboard overview
 */
export async function getDashboard(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true
          }
        },
        enrollments: {
          include: {
            class: true
          }
        },
        grades: true,
        attendance: {
          orderBy: {
            date: 'desc'
          },
          take: 10
        },
        submissions: {
          include: {
            assignment: true
          },
          orderBy: {
            submittedAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student profile not found" 
      });
    }

    // Calculate statistics
    const totalClasses = student.enrollments.length;
    const totalGrades = student.grades.length;
    const averageGrade = totalGrades > 0
      ? (student.grades.reduce((sum, g) => sum + g.score, 0) / totalGrades).toFixed(2)
      : '0.00';

    const totalAttendance = student.attendance.length;
    const presentCount = student.attendance.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = totalAttendance > 0
      ? ((presentCount / totalAttendance) * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        studentInfo: {
          name: `${student.firstName} ${student.lastName}`,
          email: student.user.email,
          studentId: student.id
        },
        statistics: {
          totalClasses,
          averageGrade: `${averageGrade}%`,
          attendanceRate: `${attendanceRate}%`,
          totalSubmissions: student.submissions.length
        },
        recentAttendance: student.attendance,
        recentSubmissions: student.submissions
      }
    });

  } catch (error: any) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch dashboard'
    });
  }
}

// Export as object
export const PortalController = {
  getMyGrades,
  getMySchedule,
  getMyAttendance,
  getMyAssignments,
  getDashboard
};