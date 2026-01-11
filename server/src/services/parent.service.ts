// FILE: server/src/services/parent.service.ts
import { Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

interface ParentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const getAllParents = async ({ page = 1, limit = 10, search = '' }: ParentQueryParams) => {
  const skip = (page - 1) * limit;

  const whereClause: Prisma.ParentWhereInput = search ? {
    OR: [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { phone: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [total, parents] = await prisma.$transaction([
    prisma.parent.count({ where: whereClause }),
    prisma.parent.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      include: {
        user: { select: { email: true, isActive: true } },
        students: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { lastName: 'asc' }
    })
  ]);

  return {
    data: parents,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

export const createParent = async (data: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error('Email already in use');

  const password = data.password || 'Parent123';
  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: UserRole.PARENT,
        isActive: true
      }
    });

    return await tx.parent.create({
      data: {
        userId: newUser.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        // REMOVED: relationship field (Not in your DB schema)
      }
    });
  });
};

export const updateParent = async (id: string, data: any) => {
  return await prisma.parent.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      // REMOVED: relationship field
    }
  });
};

// === LINKING LOGIC ===
export const linkStudentsToParent = async (parentId: string, studentIds: string[]) => {
  // We update the students to point to this parent
  return await prisma.student.updateMany({
    where: { id: { in: studentIds } },
    data: { parentId: parentId }
  });
};

export const deleteParent = async (id: string) => {
  const parent = await prisma.parent.findUnique({ where: { id }, select: { userId: true } });
  if (!parent) throw new Error("Parent not found");

  // Unlink children first (don't delete the kids!)
  await prisma.student.updateMany({
    where: { parentId: id },
    data: { parentId: null }
  });

  return await prisma.user.delete({ where: { id: parent.userId } });
};