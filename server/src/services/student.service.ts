// FILE: server/src/services/student.service.ts
import { Gender, Prisma, UserRole } from '@prisma/client'; // Import Prisma types
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

// PROFESSIONAL: Accept Query Parameters for Scalability
interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
}

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
      // Status Filter
      status !== 'ALL' ? { user: { isActive: status === 'ACTIVE' } } : {},
      // Search Filter (Matches First, Last, or Email)
      search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      } : {}
    ]
  };

  // 2. Execute Queries in Parallel (Count + Data)
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

  // 3. Return Standardized Pagination Response
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

export const createStudent = async (data: any) => {
  // ... (Keep existing Create logic)
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error('Email already in use');

  const hashedPassword = await bcrypt.hash('Student123', 10);

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

export const getStudentById = async (id: string) => {
  // ... (Keep existing GetById logic)
  return await prisma.student.findUnique({
    where: { id },
    include: { 
      user: { select: { email: true, isActive: true } },
      enrollments: { include: { section: true } },
      studentFees: { include: { feeStructure: true } }
    }
  });
};

export const updateStudent = async (id: string, data: any) => {
  // ... (Keep existing Update logic)
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

// === NEW: SOFT DELETE (DEACTIVATE) ===
export const deactivateStudent = async (id: string) => {
  const student = await prisma.student.findUnique({ 
    where: { id },
    select: { userId: true } 
  });

  if (!student) throw new Error("Student not found");

  // We don't delete the record. We just lock the account.
  return await prisma.user.update({
    where: { id: student.userId },
    data: { isActive: false }
  });
};