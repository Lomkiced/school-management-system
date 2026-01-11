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

export const getAllTeachers = async ({ 
  page = 1, 
  limit = 10, 
  search = '', 
  status = 'ACTIVE' 
}: TeacherQueryParams) => {
  const skip = (page - 1) * limit;

  // 1. Build Filter
  const whereClause: Prisma.TeacherWhereInput = {
    AND: [
      status !== 'ALL' ? { user: { isActive: status === 'ACTIVE' } } : {},
      search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { specialization: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      } : {}
    ]
  };

  // 2. Parallel Fetch (Data + Count)
  const [total, teachers] = await prisma.$transaction([
    prisma.teacher.count({ where: whereClause }),
    prisma.teacher.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      include: {
        // FIXED: Removed 'lastLogin' because it does not exist in your database
        user: { select: { email: true, isActive: true } },
        // Count assigned classes to show workload
        _count: {
          select: { classes: true } 
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
};

export const getTeacherById = async (id: string) => {
  return await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true, role: true, isActive: true }
      },
      classes: {
        include: {
          subject: true,
          section: true,
          // FIXED: Removed '_count: { enrollments: true }' because Class does not link directly to Enrollment in your schema
        }
      }
    }
  });
};

// --- Write Operations ---

export const createTeacher = async (data: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) throw new Error('Email already in use');

  // FIX: Use provided password or fallback
  const passwordToHash = data.password || 'Teacher123';
  const hashedPassword = await bcrypt.hash(passwordToHash, 10);

  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword, // Stores correct hash
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
        address: data.address || null,
        specialization: data.specialization || 'General',
      }
    });

    return { ...newTeacherProfile, email: newUser.email };
  });
};

export const updateTeacher = async (id: string, data: any) => {
  return await prisma.teacher.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      specialization: data.specialization
    }
  });
};

// === TOGGLE STATUS ===
export const toggleTeacherStatus = async (id: string) => {
  const teacher = await prisma.teacher.findUnique({ 
    where: { id },
    select: { userId: true, user: { select: { isActive: true } } } 
  });

  if (!teacher) throw new Error("Teacher not found");

  // Flip the status
  return await prisma.user.update({
    where: { id: teacher.userId },
    data: { isActive: !teacher.user.isActive }
  });
};