// FILE: server/src/services/audit.service.ts

import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

// Helper to log actions
export const logAction = async (userId: string, action: string, details: string) => {
  const log = await prisma.auditLog.create({
    data: { userId, action, details }
  });

  try {
    getIO().emit('new_audit_log', log);
  } catch (e) { 
    // Ignore socket errors during startup
  }

  return log;
};

// CRITICAL FIX: The User table does not have firstName/lastName.
// We select 'email' instead. We also grab the profile relations
// just in case the frontend wants to dig for the name later.
export const getSystemLogs = async () => {
  return await prisma.auditLog.findMany({
    take: 50, // Limit to last 50 logs for performance
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          // We include the profiles so we can find the name if needed
          adminProfile: { select: { firstName: true, lastName: true } },
          teacherProfile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { firstName: true, lastName: true } }
        }
      }
    }
  });
};