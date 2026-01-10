import prisma from '../utils/prisma';

export const getDashboardStats = async () => {
  // 1. Basic Counts
  const totalStudents = await prisma.student.count();
  const totalTeachers = await prisma.teacher.count();
  const activeClasses = await prisma.class.count();

  // 2. Financials
  // A. Total Collected (Revenue) -> Sum of all payments
  const totalRevenueResult = await prisma.payment.aggregate({
    _sum: { amount: true }
  });
  const totalRevenue = totalRevenueResult._sum.amount || 0;

  // B. Total Expected (Total Cost of all fees assigned to students)
  // We need to fetch all student fees and sum their structure amounts
  const allStudentFees = await prisma.studentFee.findMany({
    include: { feeStructure: true }
  });
  
  const totalExpected = allStudentFees.reduce((sum, fee) => {
    return sum + fee.feeStructure.amount;
  }, 0);

  // C. Total Pending = Expected - Revenue
  // (Note: This is a simplified calculation for the dashboard)
  const totalPending = totalExpected - totalRevenue;

  // 3. Gender Distribution
  const genderStats = await prisma.student.groupBy({
    by: ['gender'],
    _count: { gender: true }
  });

  // 4. Recent Activity
  const recentEnrollments = await prisma.student.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { 
      firstName: true, 
      lastName: true, 
      createdAt: true 
    }
  });

  return {
    counts: {
      students: totalStudents,
      teachers: totalTeachers,
      classes: activeClasses
    },
    financials: {
      revenue: totalRevenue,
      pending: totalPending > 0 ? totalPending : 0 // Ensure no negative numbers
    },
    demographics: genderStats,
    activity: recentEnrollments
  };
};