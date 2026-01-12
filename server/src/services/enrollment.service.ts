// FILE: server/src/services/enrollment.service.ts
import prisma from '../utils/prisma';

/**
 * Enroll multiple students in a class (bulk enrollment)
 */
export async function enrollStudentBulk(classId: string, studentIds: string[]) {
  // 1. Validate Class Exists
  const classExists = await prisma.class.findUnique({
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
  const existingEnrollments = await prisma.enrollment.findMany({
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
  await prisma.enrollment.createMany({
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
export async function getEnrollmentsByClass(classId: string) {
  return await prisma.enrollment.findMany({
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
export async function getEnrollmentsByStudent(studentId: string) {
  return await prisma.enrollment.findMany({
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
export async function getEnrollmentOptions() {
  // 1. Fetch Active Students with their current enrollments
  const students = await prisma.student.findMany({
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
  const classes = await prisma.class.findMany({
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
export async function unenrollStudent(classId: string, studentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
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

  return await prisma.enrollment.delete({
    where: {
      id: enrollment.id
    }
  });
}

/**
 * Get enrollment statistics
 */
export async function getEnrollmentStats() {
  // Total enrollments
  const totalEnrollments = await prisma.enrollment.count();

  // Enrollments by class
  const enrollmentsByClass = await prisma.class.findMany({
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
  const studentsEnrolled = await prisma.student.count({
    where: {
      enrollments: {
        some: {}
      }
    }
  });

  // Students not enrolled in any class
  const studentsNotEnrolled = await prisma.student.count({
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
export async function transferStudent(studentId: string, fromClassId: string, toClassId: string) {
  // Validate both classes exist
  const [fromClass, toClass] = await Promise.all([
    prisma.class.findUnique({ where: { id: fromClassId } }),
    prisma.class.findUnique({ where: { id: toClassId } })
  ]);

  if (!fromClass) {
    throw new Error("Source class not found");
  }

  if (!toClass) {
    throw new Error("Destination class not found");
  }

  // Check if student is enrolled in source class
  const currentEnrollment = await prisma.enrollment.findUnique({
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
  const existingEnrollment = await prisma.enrollment.findUnique({
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
  const result = await prisma.$transaction([
    // Remove from old class
    prisma.enrollment.delete({
      where: { id: currentEnrollment.id }
    }),
    // Add to new class
    prisma.enrollment.create({
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