import { Gender, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const getAllStudents = async () => {
  return await prisma.student.findMany({
    include: {
      user: {
        select: { email: true, isActive: true }
      },
      // NEW: Fetch their section enrollments
      enrollments: {
        include: {
          section: true
        },
        orderBy: { joinedAt: 'desc' }, // Get latest first
        take: 1
      }
    },
    orderBy: { lastName: 'asc' }
  });
};

export const createStudent = async (data: any) => {
  // 1. Check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) throw new Error('Email already in use');

  // 2. Hash default password (e.g., "Student123")
  // In a real app, you might auto-generate this and email it to them
  const hashedPassword = await bcrypt.hash('Student123', 10);

  // 3. Transaction: Create User AND Student Profile together
  const newStudent = await prisma.user.create({
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

  return newStudent;
};

export const getStudentById = async (id: string) => {
  return await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { email: true } } }
  });
};