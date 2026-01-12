// FILE: server/src/services/grading.service.ts
import prisma from '../utils/prisma';

interface GradeQueryParams {
  studentId?: string;
  classId?: string;
}

export const getGrades = async (params: GradeQueryParams) => {
  const { studentId, classId } = params;

  // 1. Fetch Grades based on filters
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
  // Validate if student is enrolled in that class
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: data.studentId,
      classId: data.classId
    }
  });

  if (!enrollment) throw new Error("Student is not enrolled in this class");

  // Upsert: Update if exists, Create if new
  return await prisma.grade.upsert({
    where: {
      studentId_classId_termId_subjectId: { // Ensure this composite key exists in schema.prisma
        studentId: data.studentId,
        classId: data.classId,
        termId: data.termId,
        subjectId: data.subjectId // If you grade by subject
      }
    },
    update: {
      score: parseFloat(data.score),
      feedback: data.feedback,
      updatedAt: new Date()
    },
    create: {
      studentId: data.studentId,
      classId: data.classId,
      termId: data.termId,
      subjectId: data.subjectId, // Ensure this matches your DB schema
      score: parseFloat(data.score),
      feedback: data.feedback,
      gradedById: data.gradedBy
    }
  });
};

/**
 * Fallback: If your schema doesn't have SubjectId in Grade, 
 * use this simplified version for recording grades just by Class/Term.
 */
export const recordSimpleGrade = async (data: any) => {
   return await prisma.grade.create({
     data: {
       studentId: data.studentId,
       classId: data.classId,
       termId: data.termId,
       score: parseFloat(data.score),
       feedback: data.feedback
     }
   });
};