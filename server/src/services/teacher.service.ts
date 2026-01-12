// FILE: server/src/services/teacher.service.ts
import { Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

// --- Interfaces ---
interface TeacherQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
}

// --- Read Operations ---

export async function getAllTeachers({ 
  page = 1, 
  limit = 10, 
  search = '', 
  status = 'ACTIVE' 
}: TeacherQueryParams) {
  const skip = (page - 1) * limit;

  // Build Filter (removed 'specialization' as it doesn't exist in schema)
  const whereClause: Prisma.TeacherWhereInput = {
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

  // Parallel Fetch (Data + Count)
  const [total, teachers] = await prisma.$transaction([
    prisma.teacher.count({ where: whereClause }),
    prisma.teacher.findMany({
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
        classes: {
          include: {
            subject: {
              select: {
                name: true,
                code: true
              }
            }
          }
        },
        _count: {
          select: { 
            classes: true 
          } 
        }
      },
      orderBy: { lastName: 'asc' }
    })
  ]);

  return {
    data: teachers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getTeacherById(id: string) {
  return await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: {
        select: { 
          email: true, 
          role: true, 
          isActive: true 
        }
      },
      classes: {
        include: {
          subject: {
            select: {
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
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
              grades: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      },
      _count: {
        select: {
          classes: true
        }
      }
    }
  });
}

// --- Write Operations ---

export async function createTeacher(data: any) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  
  if (existingUser) {
    throw new Error('Email already in use');
  }

  // Use provided password or fallback
  const passwordToHash = data.password || 'Teacher123';
  const hashedPassword = await bcrypt.hash(passwordToHash, 10);

  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: UserRole.TEACHER,
        isActive: true
      }
    });

    const newTeacherProfile = await tx.teacher.create({
      data: {
        userId: newUser.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        address: data.address || null
      }
    });

    return { 
      ...newTeacherProfile, 
      email: newUser.email 
    };
  });
}

export async function updateTeacher(id: string, data: any) {
  // Verify teacher exists
  const teacher = await prisma.teacher.findUnique({
    where: { id }
  });

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  return await prisma.teacher.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address
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

// === TOGGLE STATUS ===
export async function toggleTeacherStatus(id: string) {
  const teacher = await prisma.teacher.findUnique({ 
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

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Flip the status
  return await prisma.user.update({
    where: { id: teacher.userId },
    data: { isActive: !teacher.user.isActive }
  });
}

// === DELETE TEACHER ===
export async function deleteTeacher(id: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: {
      userId: true,
      _count: {
        select: {
          classes: true
        }
      }
    }
  });

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  if (teacher._count.classes > 0) {
    throw new Error('Cannot delete teacher with assigned classes. Please reassign classes first.');
  }

  // Delete teacher profile and user account
  return await prisma.$transaction([
    prisma.teacher.delete({ where: { id } }),
    prisma.user.delete({ where: { id: teacher.userId } })
  ]);
}

/**
 * Get teacher statistics
 */
export async function getTeacherStats(id: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      classes: {
        include: {
          _count: {
            select: {
              enrollments: true,
              grades: true
            }
          }
        }
      }
    }
  });

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  const totalClasses = teacher.classes.length;
  const totalStudents = teacher.classes.reduce(
    (sum, cls) => sum + cls._count.enrollments, 
    0
  );
  const totalGradesGiven = teacher.classes.reduce(
    (sum, cls) => sum + cls._count.grades, 
    0
  );

  return {
    totalClasses,
    totalStudents,
    totalGradesGiven
  };
}