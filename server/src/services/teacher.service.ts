// FILE: server/src/services/teacher.service.ts
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const getAllTeachers = async () => {
  return await prisma.teacher.findMany({
    include: {
      user: {
        select: { email: true, isActive: true }
      },
      department: true // Include department if you have it
    },
    orderBy: { lastName: 'asc' }
  });
};

export const getTeacherById = async (id: string) => {
  // FIX 1: Removed parseInt. Your IDs are Strings (UUIDs).
  return await prisma.teacher.findUnique({
    where: { id: id }, 
    include: {
      user: {
        select: { email: true, role: true, isActive: true }
      },
      classes: {
        include: {
          subject: true,
          section: true
        }
      }
    }
  });
};

export const createTeacher = async (data: any) => {
  // 1. Check if email exists in the User table
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) throw new Error('Email already in use');

  const hashedPassword = await bcrypt.hash('Teacher123', 10);

  // 2. Transaction: Create User Login + Teacher Profile
  return await prisma.$transaction(async (tx) => {
    // FIX 2: Create User WITHOUT firstName/lastName
    // The User table only handles Authentication (Email/Pass/Role)
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: UserRole.TEACHER,
        isActive: true
      }
    });

    // FIX 3: Create Teacher Profile WITH firstName/lastName
    // The Teacher table handles the actual Identity
    const newTeacherProfile = await tx.teacher.create({
      data: {
        userId: newUser.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        address: data.address || null,
        specialization: data.specialization || 'General',
        // Optional: departmentId: data.departmentId ? parseInt(data.departmentId) : undefined
      }
    });

    return { ...newTeacherProfile, email: newUser.email };
  });
};

export const updateTeacher = async (id: string, data: any) => {
  // FIX 4: Removed parseInt. ID is a string.
  return await prisma.teacher.update({
    where: { id: id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      specialization: data.specialization
    }
  });
};