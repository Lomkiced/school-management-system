// FILE: server/src/services/student.service.ts
import { Gender, Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

// --- Interfaces ---
interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
}

// --- Read Operations ---

export async function getAllStudents({
  page = 1,
  limit = 10,
  search = '',
  status = 'ACTIVE'
}: StudentQueryParams) {

  const skip = (page - 1) * limit;

  // Build Dynamic Filter
  const whereClause: Prisma.StudentWhereInput = {
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
  const [total, students] = await prisma.$transaction([
    prisma.student.count({ where: whereClause }),
    prisma.student.findMany({
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

export async function getStudentById(id: string) {
  return await prisma.student.findUnique({
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

export async function createStudent(data: any) {
  // Check if student email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error('Student email already in use');
  }

  // Use provided password or fallback
  const studentPassword = data.password || 'Student123';
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);

  // Check if we need to create or link parent
  let parentId: string | null = null;

  if (data.createParent && data.parentEmail) {
    // Check if parent with this email already exists
    const existingParent = await prisma.user.findUnique({
      where: { email: data.parentEmail },
      include: { parentProfile: true }
    });

    if (existingParent) {
      // Parent exists - link to them (sibling scenario)
      if (existingParent.parentProfile) {
        parentId = existingParent.parentProfile.id;
      } else {
        throw new Error('This email belongs to a non-parent account');
      }
    } else {
      // Create new parent account
      const parentPassword = data.parentPassword || 'Parent123';
      const hashedParentPassword = await bcrypt.hash(parentPassword, 10);

      const newParentUser = await prisma.user.create({
        data: {
          email: data.parentEmail,
          password: hashedParentPassword,
          role: UserRole.PARENT,
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

      parentId = newParentUser.parentProfile!.id;
    }
  } else if (data.existingParentId) {
    // Link to an explicitly selected existing parent
    parentId = data.existingParentId;
  }

  // Create student with optional parent link
  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedStudentPassword,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender as Gender,
          address: data.address || null,
          guardianName: data.guardianName || null,
          guardianPhone: data.guardianPhone || null,
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

export async function updateStudent(id: string, data: any) {
  // Verify student exists
  const student = await prisma.student.findUnique({
    where: { id }
  });

  if (!student) {
    throw new Error('Student not found');
  }

  return await prisma.student.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender as Gender,
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
export async function toggleStudentStatus(id: string) {
  const student = await prisma.student.findUnique({
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

  return await prisma.user.update({
    where: { id: student.userId },
    data: { isActive: !student.user.isActive }
  });
}

// === PERMANENT DELETE (Hard Delete) ===
export async function deleteStudentPermanently(id: string) {
  const student = await prisma.student.findUnique({
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
  return await prisma.$transaction([
    // 1. Delete Quiz Attempts and Answers
    prisma.quizAnswer.deleteMany({
      where: {
        attempt: {
          studentId: id
        }
      }
    }),
    prisma.quizAttempt.deleteMany({
      where: { studentId: id }
    }),

    // 2. Delete Submissions
    prisma.submission.deleteMany({
      where: { studentId: id }
    }),

    // 3. Delete Grades
    prisma.grade.deleteMany({
      where: { studentId: id }
    }),

    // 4. Delete Attendance Records
    prisma.attendance.deleteMany({
      where: { studentId: id }
    }),

    // 5. Delete Enrollments
    prisma.enrollment.deleteMany({
      where: { studentId: id }
    }),

    // 6. Delete Payments first (foreign key to StudentFee)
    prisma.payment.deleteMany({
      where: {
        studentFee: {
          studentId: id
        }
      }
    }),

    // 7. Delete Student Fees
    prisma.studentFee.deleteMany({
      where: { studentId: id }
    }),

    // 8. Delete the Student Profile
    prisma.student.delete({
      where: { id }
    }),

    // 9. Finally, Delete the User Account
    prisma.user.delete({
      where: { id: student.userId }
    })
  ]);
}

/**
 * Get student statistics
 */
export async function getStudentStats(id: string) {
  const student = await prisma.student.findUnique({
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