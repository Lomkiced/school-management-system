"use strict";
// FILE: server/src/services/audit.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemLogs = exports.logAction = void 0;
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
// Helper to log actions
const logAction = async (userId, action, details) => {
    const log = await prisma_1.default.auditLog.create({
        data: { userId, action, details }
    });
    try {
        (0, socket_1.getIO)().emit('new_audit_log', log);
    }
    catch (e) {
        // Ignore socket errors during startup
    }
    return log;
};
exports.logAction = logAction;
// CRITICAL FIX: The User table does not have firstName/lastName.
// We select 'email' instead. We also grab the profile relations
// just in case the frontend wants to dig for the name later.
const getSystemLogs = async () => {
    return await prisma_1.default.auditLog.findMany({
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
exports.getSystemLogs = getSystemLogs;
