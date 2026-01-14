"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialChartData = exports.getDashboardStats = void 0;
// FILE: server/src/services/analytics.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
const getDashboardStats = async () => {
    // PROFESSIONAL: Run independent queries in PARALLEL for speed
    const [totalStudents, totalTeachers, totalClasses, monthlyRevenue] = await prisma_1.default.$transaction([
        // 1. Count Active Students
        prisma_1.default.student.count({ where: { user: { isActive: true } } }),
        // 2. Count Active Teachers
        prisma_1.default.teacher.count({ where: { user: { isActive: true } } }),
        // 3. Count Total Classes
        prisma_1.default.class.count(),
        // 4. Calculate Revenue (Sum of 'PAID' payments this month)
        prisma_1.default.payment.aggregate({
            _sum: { amount: true },
            where: {
                paidAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of this month
                }
            }
        })
    ]);
    // 5. Fetch Recent Activities (Audit Log)
    const recentActivities = await prisma_1.default.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { email: true, role: true }
            }
        }
    });
    return {
        counts: {
            students: totalStudents,
            teachers: totalTeachers,
            classes: totalClasses,
            revenue: monthlyRevenue._sum.amount || 0
        },
        recentActivities
    };
};
exports.getDashboardStats = getDashboardStats;
const getFinancialChartData = async () => {
    // Advanced: Group payments by month for the chart
    // Note: Prisma doesn't support sophisticated date grouping easily without raw SQL.
    // For a reliable cross-database solution, we fetch this year's payments and group in JS.
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const payments = await prisma_1.default.payment.findMany({
        where: { paidAt: { gte: startOfYear } },
        select: { amount: true, paidAt: true }
    });
    // Group by Month (0-11)
    const monthlyData = new Array(12).fill(0);
    payments.forEach(p => {
        const month = new Date(p.paidAt).getMonth();
        monthlyData[month] += p.amount;
    });
    return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        data: monthlyData
    };
};
exports.getFinancialChartData = getFinancialChartData;
