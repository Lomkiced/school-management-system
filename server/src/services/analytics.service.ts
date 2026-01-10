import prisma from '../utils/prisma';

export const getDashboardStats = async () => {
  // 1. Basic Counts
  const [totalStudents, totalTeachers, activeClasses] = await Promise.all([
    prisma.student.count({ where: { user: { isActive: true } } }),
    prisma.teacher.count({ where: { user: { isActive: true } } }),
    prisma.class.count(),
  ]);

  // 2. Financials (Advanced Aggregation)
  const totalRevenueResult = await prisma.payment.aggregate({
    _sum: { amount: true }
  });
  const totalRevenue = totalRevenueResult._sum.amount || 0;

  const allFees = await prisma.studentFee.findMany({ include: { feeStructure: true } });
  const totalExpected = allFees.reduce((acc, fee) => acc + fee.feeStructure.amount, 0);
  
  // 3. Financial History (For the Line Chart)
  // We fetch last 100 payments and group them by month in JS
  const payments = await prisma.payment.findMany({
    take: 100,
    orderBy: { paidAt: 'asc' },
    select: { amount: true, paidAt: true }
  });

  const historyMap: Record<string, number> = {};
  payments.forEach(p => {
    const month = new Date(p.paidAt).toLocaleString('default', { month: 'short' });
    historyMap[month] = (historyMap[month] || 0) + p.amount;
  });

  const history = Object.keys(historyMap).map(key => ({
    name: key,
    total: historyMap[key]
  }));

  // 4. Demographics
  const genderStats = await prisma.student.groupBy({
    by: ['gender'],
    _count: { gender: true }
  });

  const demographics = genderStats.map(g => ({
    name: g.gender,
    value: g._count.gender
  }));

  // 5. Recent Activity (Fetching Audit Logs correctly)
  const logs = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, role: true } } }
  });

  const activity = logs.map(log => ({
    action: log.action.replace('_', ' '), // Clean string
    user: log.user.email,
    role: log.user.role,
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
      pending: Math.max(0, totalExpected - totalRevenue),
      history: history // <--- CRITICAL FIX: Sending graph data
    },
    demographics, // <--- CRITICAL FIX: Sending gender data
    activity // <--- CRITICAL FIX: Sending audit logs
  };
};