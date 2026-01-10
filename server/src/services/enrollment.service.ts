import prisma from '../utils/prisma';

export const enrollStudent = async (data: any) => {
  // Check if already enrolled in this section
  const existing = await prisma.enrollment.findFirst({
    where: {
      studentId: data.studentId,
      sectionId: parseInt(data.sectionId)
    }
  });

  if (existing) throw new Error('Student is already enrolled in this section');

  return await prisma.enrollment.create({
    data: {
      studentId: data.studentId,
      sectionId: parseInt(data.sectionId)
    },
    include: {
      section: true,
      student: true
    }
  });
};

// Helper for dropdowns
export const getEnrollmentOptions = async () => {
  const students = await prisma.student.findMany({
    orderBy: { lastName: 'asc' }
  });
  const sections = await prisma.section.findMany({
    include: { gradeLevel: true } // Include grade name (e.g., Grade 10)
  });
  return { students, sections };
};