"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// FILE: server/src/utils/prisma.ts
const client_1 = require("@prisma/client");
// Prevent multiple instances in development (Hot Reloading fix)
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma || new client_1.PrismaClient({
    log: ['query', 'error', 'warn'], // Enable logs to see SQL errors in terminal
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
exports.default = exports.prisma;
