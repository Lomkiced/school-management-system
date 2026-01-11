// FILE: server/src/services/student.service.ts
import { Gender, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const getAllStudents = async () => {
  return await prisma.student.findMany({
    // PROFESSIONAL: Only fetch active students by default
    where: {
      user: {
        isActive: true
      }
    },
    include: {
      user: {
        select: { email: true, isActive: true }
      },
      enrollments: {
        include: {
          section: true
        },
        orderBy: { joinedAt: 'desc' },
        take: 1
      }
    },
    orderBy: { lastName: 'asc' }
  });
};

export const getStudentById = async (id: string) => {
  return await prisma.student.findUnique({
    where: { id },
    include: { 
      user: { select: { email: true, isActive: true } },
      enrollments: { include: { section: true } },
      studentFees: { include: { feeStructure: true } } // Helpful for the "Ledger" view later
    }
  });
};

export const createStudent = async (data: any) => {
  // 1. Check email
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) throw new Error('Email already in use');

  const hashedPassword = await bcrypt.hash('Student123', 10);

  // 2. Transaction: User + Profile
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
    include: {
      studentProfile: true
    }
  });
};

// === NEW: UPDATE CAPABILITY ===
export const updateStudent = async (id: string, data: any) => {
  // We update the Student Profile directly
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