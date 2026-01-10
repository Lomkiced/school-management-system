"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitLiveStats = exports.getDashboardStats = void 0;
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
const getDashboardStats = async () => {
    // 1. Basic Counts
    // FIX: Removed { where: { user: { isActive: true } } } to ensure all records are counted
    const [totalStudents, totalTeachers, activeClasses] = await Promise.all([
        prisma_1.default.student.count(),
        prisma_1.default.teacher.count(),
        prisma_1.default.class.count(),
    ]);
    // 2. Financials (Advanced Aggregation)
    const totalRevenueResult = await prisma_1.default.payment.aggregate({
        _sum: { amount: true }
    });
    const totalRevenue = totalRevenueResult._sum.amount || 0;
    // Calculate pending fees
    const allFees = await prisma_1.default.studentFee.findMany({
        include: { feeStructure: true }
    });
    // totalExpected = sum of all assigned fees
    const totalExpected = allFees.reduce((acc, fee) => acc + fee.feeStructure.amount, 0);
    // pending = expected - revenue (Ensure it doesn't go below zero due to partial payment logic)
    const pendingAmount = Math.max(0, totalExpected - totalRevenue);
    // 3. Financial History (Optimized for Charts)
    const payments = await prisma_1.default.payment.findMany({
        take: 100,
        orderBy: { paidAt: 'asc' },
        select: { amount: true, paidAt: true }
    });
    const historyMap = {};
    payments.forEach(p => {
        // Group by 'Jan', 'Feb', etc.
        const month = new Date(p.paidAt).toLocaleString('default', { month: 'short' });
        historyMap[month] = (historyMap[month] || 0) + p.amount;
    });
    const history = Object.keys(historyMap).map(key => ({
        name: key,
        total: historyMap[key]
    }));
    // 4. Demographics
    const genderStats = await prisma_1.default.student.groupBy({
        by: ['gender'],
        _count: { gender: true }
    });
    // Transform to standardized { name, value } format for frontend charts
    const demographics = genderStats.map(g => ({
        name: g.gender,
        value: g._count.gender
    }));
    // 5. Recent Activity
    const logs = await prisma_1.default.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { email: true, role: true }
            }
        }
    });
    const activity = logs.map(log => ({
        id: log.id,
        action: log.action.replace('_', ' '),
        user: log.user.email,
        role: log.user.role,
        details: log.details,
        createdAt: log.createdAt
    }));
    return {
        counts: {
            students: totalStudents,
            teachers: totalTeachers,
            classes: activeClasses
        },
        financials: {
            revenue: totalRevenue,
            pending: pendingAmount,
            history: history
        },
        demographics,
        activity
    };
};
exports.getDashboardStats = getDashboardStats;
// If you have a function that emits stats updates, update it:
const emitLiveStats = async () => {
    const stats = await (0, exports.getDashboardStats)();
    try {
        // FIX: Use getIO() instead of io
        (0, socket_1.getIO)().emit('dashboard_update', stats);
    }
    catch (error) {
        console.warn("Socket not initialized yet, skipping broadcast");
    }
};
exports.emitLiveStats = emitLiveStats;
