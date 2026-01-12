// FILE: server/src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development (Hot Reloading fix)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'], // Enable logs to see SQL errors in terminal
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;