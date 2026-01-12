// FILE: server/src/services/grading.service.ts
import prisma from '../utils/prisma';

interface GradeQueryParams {
  studentId?: string;
  classId?: string;
}

export const getGrades = async (params: GradeQueryParams) => {
  const { studentId, classId } = params;

  const grades = await prisma.grade.findMany({
    where: {
      AND: [
        studentId ? { studentId } : {},
        classId ? { classId } : {}
      ]
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      class: { select: { name: true } },
      term: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return grades;
};

export const recordGrade = async (data: any) => {
  // 1. Verify Enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: data.studentId,
      classId: data.classId
    }
  });

  if (!enrollment) throw new Error("Student is not enrolled in this class");

  // 2. Upsert Grade
  // Note: Schema uses @@unique([studentId, classId, termId, subjectId])
  return await prisma.grade.upsert({
    where: {
      studentId_classId_termId_subjectId: {
        studentId: data.studentId,
        classId: data.classId,
        termId: data.termId,
        subjectId: data.subjectId || "" // Handle optional subjectId if needed or adjust logic
      }
    },
    update: {
      score: parseFloat(data.score),
      feedback: data.feedback,
      gradedById: data.gradedBy
    },
    create: {
      studentId: data.studentId,
      classId: data.classId,
      termId: data.termId,
      subjectId: data.subjectId || "", // Ensure this aligns with your data flow
      score: parseFloat(data.score),
      feedback: data.feedback,
      gradedById: data.gradedBy
    }
  });
};