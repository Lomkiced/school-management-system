import prisma from '../utils/prisma';

export const logAction = async (userId: string, action: string, details: string) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, details }
    });
  } catch (error) {
    console.error("Failed to create audit log", error);
  }
};

export const getSystemLogs = async () => {
  return await prisma.auditLog.findMany({
    include: {
      user: {
        select: { email: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Only show last 50 actions
  });
};