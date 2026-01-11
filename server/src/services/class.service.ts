// FILE: server/src/services/class.service.ts
import prisma from '../utils/prisma';

export const getAllClasses = async () => {
  return await prisma.class.findMany({
    include: {
      teacher: true,
      subject: true,
      section: true,
    },
    orderBy: { id: 'desc' }
  });
};

export const getClassById = async (id: number) => {
  // In your Schema, Students enroll in a SECTION, not directly in a Class.
  // So we fetch the Section's enrollments to see who is in this class.
  return await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: true,
      subject: true,
      section: {
        include: {
          // Fetch students via the Section
          enrollments: {
            include: {
              student: true
            }
          }
        }
      }
    }
  });
};

export const createClass = async (data: any) => {
  // Removed 'room' and 'schedule' because they don't exist in your database yet.
  return await prisma.class.create({
    data: {
      teacherId: data.teacherId,
      subjectId: parseInt(data.subjectId),
      sectionId: parseInt(data.sectionId),
    },
    include: {
      teacher: true,
      subject: true,
      section: true
    }
  });
};

export const updateClass = async (id: number, data: any) => {
  return await prisma.class.update({
    where: { id },
    data: {
      teacherId: data.teacherId,
      subjectId: parseInt(data.subjectId),
      sectionId: parseInt(data.sectionId),
    },
    include: {
      teacher: true,
      subject: true,
      section: true
    }
  });
};

export const enrollStudent = async (classId: number, studentId: string) => {
  // 1. First, find out which Section this Class belongs to
  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { sectionId: true }
  });

  if (!targetClass) {
    throw new Error("Class not found");
  }

  // 2. Check if student is already enrolled in that SECTION
  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_sectionId: {
        sectionId: targetClass.sectionId,
        studentId: studentId
      }
    }
  });

  if (existing) {
    throw new Error("Student is already enrolled in this section");
  }

  // 3. Create Enrollment in the SECTION (not the Class)
  return await prisma.enrollment.create({
    data: {
      sectionId: targetClass.sectionId,
      studentId: studentId
    },
    include: {
      student: true,
      section: true
    }
  });
};

export const getFormOptions = async () => {
  const teachers = await prisma.teacher.findMany();
  const subjects = await prisma.subject.findMany();
  const sections = await prisma.section.findMany();
  return { teachers, subjects, sections };
};