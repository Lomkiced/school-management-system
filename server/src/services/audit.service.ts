import { getIO } from '../lib/socket'; // <--- CHANGE THIS IMPORT
import prisma from '../utils/prisma';

export const logAction = async (userId: string, action: string, details: string) => {
  const log = await prisma.auditLog.create({
    data: { userId, action, details }
  });

  try {
    // FIX: Use getIO()
    getIO().emit('new_audit_log', log);
  } catch (e) { 
    // Ignore socket errors during startup
  }

  return log;
};