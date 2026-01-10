import prisma from '../utils/prisma';

export const getAllClasses = async () => {
  // Deep fetch: Get the Class, plus the Teacher's name, Subject name, and Section name
  return await prisma.class.findMany({
    include: {
      teacher: true,
      subject: true,
      section: true,
    },
    orderBy: { id: 'desc' }
  });
};

export const createClass = async (data: any) => {
  // Validate that the section and subject exist
  // In a real app, we would add checks here to ensure no scheduling conflicts
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

// Helper to get lists for dropdowns
export const getFormOptions = async () => {
  const teachers = await prisma.teacher.findMany();
  const subjects = await prisma.subject.findMany();
  const sections = await prisma.section.findMany();
  return { teachers, subjects, sections };
};