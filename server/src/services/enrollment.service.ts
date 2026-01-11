// FILE: server/src/services/enrollment.service.ts
import prisma from '../utils/prisma';

export const enrollStudentBulk = async (sectionId: number, studentIds: string[]) => {
  // 1. Validate Section Exists
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { 
      gradeLevel: true, 
      academicYear: true 
    }
  });

  if (!section) throw new Error("Section not found");

  // 2. Filter Duplicates: Find students ALREADY in this section
  const existingEnrollments = await prisma.enrollment.findMany({
    where: {
      sectionId: sectionId,
      studentId: { in: studentIds }
    },
    select: { studentId: true }
  });

  const alreadyEnrolledIds = new Set(existingEnrollments.map(e => e.studentId));

  // 3. Determine who needs to be added
  const newStudentIds = studentIds.filter(id => !alreadyEnrolledIds.has(id));

  if (newStudentIds.length === 0) {
    return { 
      added: 0, 
      skipped: studentIds.length, 
      message: "No new enrollments. All selected students are already in this section." 
    };
  }

  // 4. Bulk Insert
  await prisma.enrollment.createMany({
    data: newStudentIds.map(studentId => ({
      sectionId,
      studentId
    }))
  });

  return {
    added: newStudentIds.length,
    skipped: alreadyEnrolledIds.size,
    message: `Successfully enrolled ${newStudentIds.length} students.`
  };
};

export const getEnrollmentOptions = async () => {
  // 1. Fetch Active Students Only (Optimized Select)
  const students = await prisma.student.findMany({
    where: { user: { isActive: true } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: { select: { email: true } }
    },
    orderBy: { lastName: 'asc' }
  });

  // 2. Fetch Sections with Hierarchy
  const sections = await prisma.section.findMany({
    include: {
      gradeLevel: true,
      academicYear: true
    },
    orderBy: [
      { academicYear: { startDate: 'desc' } }, // Newest academic years first
      { gradeLevel: { level: 'asc' } },
      { name: 'asc' }
    ]
  });

  return { students, sections };
};