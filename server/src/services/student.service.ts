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

export const getAllStudents = async ({ 
  page = 1, 
  limit = 10, 
  search = '', 
  status = 'ACTIVE' 
}: StudentQueryParams) => {
  
  const skip = (page - 1) * limit;

  // 1. Build Dynamic Filter
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

  // 2. Execute Queries
  const [total, students] = await prisma.$transaction([
    prisma.student.count({ where: whereClause }),
    prisma.student.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      include: {
        user: { select: { email: true, isActive: true } },
        enrollments: {
          include: { section: true },
          orderBy: { joinedAt: 'desc' },
          take: 1
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
};

export const getStudentById = async (id: string) => {
  return await prisma.student.findUnique({
    where: { id },
    include: { 
      user: { select: { email: true, isActive: true } },
      enrollments: { include: { section: true } },
      studentFees: { include: { feeStructure: true } } 
    }
  });
};

// --- Write Operations ---

export const createStudent = async (data: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) throw new Error('Email already in use');

  // Use provided password or fallback
  const passwordToHash = data.password || 'Student123';
  const hashedPassword = await bcrypt.hash(passwordToHash, 10);

  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender as Gender,
          address: data.address,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone
        }
      }
    },
    include: { studentProfile: true }
  });
};

export const updateStudent = async (id: string, data: any) => {
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
    }
  });
};

// === TOGGLE STATUS (Soft Delete) ===
export const toggleStudentStatus = async (id: string) => {
  const student = await prisma.student.findUnique({ 
    where: { id },
    select: { userId: true, user: { select: { isActive: true } } } 
  });

  if (!student) throw new Error("Student not found");

  return await prisma.user.update({
    where: { id: student.userId },
    data: { isActive: !student.user.isActive }
  });
};

// === PERMANENT DELETE (Hard Delete - Fixed) ===
export const deleteStudentPermanently = async (id: string) => {
  const student = await prisma.student.findUnique({ 
    where: { id },
    select: { id: true, userId: true } 
  });

  if (!student) throw new Error("Student not found");

  // TRANSACTION: Clean up everything linked to the student first
  return await prisma.$transaction([
    // 1. Delete Enrollments (Must go first!)
    prisma.enrollment.deleteMany({ where: { studentId: id } }),
    
    // 2. Delete Student Fees (Must go before Student)
    prisma.studentFee.deleteMany({ where: { studentId: id } }),

    // 3. Delete LMS Submissions/Grades (If you have them later, add them here)
    // prisma.grade.deleteMany({ where: { studentId: id } }),

    // 4. Delete the Student Profile
    prisma.student.delete({ where: { id: id } }),

    // 5. Finally, Delete the User Login
    prisma.user.delete({ where: { id: student.userId } })
  ]);
};