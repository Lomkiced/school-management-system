// FILE: server/src/services/analytics.service.ts
import prisma from '../utils/prisma';

export const getAdminDashboardStats = async () => {
  // Execute all independent queries in PARALLEL for speed
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    financeData,
    recentLogs,
    enrollmentTrend
  ] = await Promise.all([
    // 1. Basic Counts
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),

    // 2. Financial Aggregation (Sum of Paid vs Pending)
    prisma.studentFee.groupBy({
      by: ['status'],
      _sum: {
        // We assume 'amount' exists on FeeStructure, but StudentFee links to it.
        // Since Prisma grouping by relation is tricky, we'll do a raw aggregate or simplified approach.
        // For 'Professional' speed, we fetch raw payment sums:
      },
      _count: true
    }),

    // 3. Recent Audit Activity (Security)
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, role: true } } }
    }),

    // 4. Enrollment Trends (Last 6 Months)
    // We group students by monthJoined
    prisma.$queryRaw`
      SELECT TO_CHAR("joinedAt", 'Mon') as month, COUNT(*) as count
      FROM "Enrollment"
      WHERE "joinedAt" > NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR("joinedAt", 'Mon'), EXTRACT(MONTH FROM "joinedAt")
      ORDER BY EXTRACT(MONTH FROM "joinedAt")
    `
  ]);

  // 2b. Correct Financial Calculation (Separated for accuracy)
  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amount: true }
  });

  // Calculate Pending Fees (Approximation based on fees count)
  // In a real huge app, this would be a cached value.
  const pendingFeesCount = financeData.find(f => f.status === 'PENDING')?._count || 0;

  return {
    cards: {
      students: totalStudents,
      teachers: totalTeachers,
      classes: totalClasses,
      revenue: totalRevenue._sum.amount || 0,
      pendingInvoices: pendingFeesCount
    },
    recentActivity: recentLogs,
    charts: {
      enrollment: enrollmentTrend
    }
  };
};

export const getTeacherAnalytics = async (teacherId: string) => {
  // Analytics specific to a Teacher's performance
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherId },
    include: { classes: { select: { id: true } } } // Get their class IDs
  });

  if (!teacher) throw new Error("Teacher profile not found");

  const classIds = teacher.classes.map(c => c.id);

  const [totalStudents, assignmentsCreated, avgAttendance] = await Promise.all([
    // Count distinct students in their classes
    prisma.enrollment.count({ where: { section: { classes: { some: { teacherId: teacher.id } } } } }),
    
    // Count assignments they made
    prisma.assignment.count({ where: { classId: { in: classIds } } }),

    // Calculate Average Attendance in their classes
    prisma.attendance.groupBy({
      by: ['status'],
      where: { classId: { in: classIds } },
      _count: true
    })
  ]);

  return {
    totalStudents,
    assignmentsCreated,
    attendanceStats: avgAttendance
  };
};