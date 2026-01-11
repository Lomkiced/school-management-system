// FILE: server/src/services/analytics.service.ts
import prisma from '../utils/prisma';

export const getDashboardStats = async () => {
  // PROFESSIONAL: Run independent queries in PARALLEL for speed
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    monthlyRevenue
  ] = await prisma.$transaction([
    // 1. Count Active Students
    prisma.student.count({ where: { user: { isActive: true } } }),
    
    // 2. Count Active Teachers
    prisma.teacher.count({ where: { user: { isActive: true } } }),
    
    // 3. Count Total Classes
    prisma.class.count(),

    // 4. Calculate Revenue (Sum of 'PAID' payments this month)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of this month
        }
      }
    })
  ]);

  // 5. Fetch Recent Activities (Audit Log)
  const recentActivities = await prisma.auditLog.findMany({
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

export const getFinancialChartData = async () => {
  // Advanced: Group payments by month for the chart
  // Note: Prisma doesn't support sophisticated date grouping easily without raw SQL.
  // For a reliable cross-database solution, we fetch this year's payments and group in JS.
  
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  
  const payments = await prisma.payment.findMany({
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