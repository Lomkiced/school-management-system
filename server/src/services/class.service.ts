// FILE: server/src/services/class.service.ts
import prisma from '../utils/prisma';

/**
 * Get all classes with their related data
 */
export async function getAllClasses() {
  return await prisma.class.findMany({
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
export async function getClassById(id: string) {
  return await prisma.class.findUnique({
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
export async function createClass(data: {
  name: string;
  teacherId?: string;
  subjectId?: string;
}) {
  return await prisma.class.create({
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
export async function updateClass(id: string, data: {
  name?: string;
  teacherId?: string;
  subjectId?: string;
}) {
  return await prisma.class.update({
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
export async function deleteClass(id: string) {
  return await prisma.class.delete({
    where: { id }
  });
}

/**
 * Enroll a student in a class
 */
export async function enrollStudent(classId: string, studentId: string) {
  // Check if class exists
  const classExists = await prisma.class.findUnique({
    where: { id: classId }
  });

  if (!classExists) {
    throw new Error("Class not found");
  }

  // Check if student exists
  const studentExists = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!studentExists) {
    throw new Error("Student not found");
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
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
  return await prisma.enrollment.create({
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
export async function unenrollStudent(classId: string, studentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
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

  return await prisma.enrollment.delete({
    where: {
      id: enrollment.id
    }
  });
}

/**
 * Get students enrolled in a specific class
 */
export async function getClassStudents(classId: string) {
  const enrollments = await prisma.enrollment.findMany({
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
export async function getFormOptions() {
  const [teachers, subjects] = await Promise.all([
    prisma.teacher.findMany({
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
    prisma.subject.findMany({
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
export async function getClassStats(classId: string) {
  const classData = await prisma.class.findUnique({
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
  const grades = await prisma.grade.findMany({
    where: { classId },
    select: { score: true }
  });

  const averageGrade = grades.length > 0
    ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
    : 0;

  // Calculate attendance rate
  const attendanceRecords = await prisma.attendance.findMany({
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