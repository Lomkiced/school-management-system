import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const getAllTeachers = async () => {
  return await prisma.teacher.findMany({
    include: {
      user: {
        select: { email: true, isActive: true }
      }
    },
    orderBy: { lastName: 'asc' }
  });
};

export const createTeacher = async (data: any) => {
  // Check email
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) throw new Error('Email already in use');

  // Default password for teachers
  const hashedPassword = await bcrypt.hash('Teacher123', 10);

  // Create User + Teacher Profile
  const newTeacher = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address
        }
      }
    },
    include: {
      teacherProfile: true
    }
  });

  return newTeacher;
};