import { io } from '../server'; // Import Socket.io instance
import prisma from '../utils/prisma';

// === ASSIGNMENTS ===

export const createAssignment = async (classId: number, data: any) => {
  const assignment = await prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      maxScore: parseFloat(data.maxScore),
      classId: classId
    }
  });

  // REAL-TIME NOTIFICATION: Notify all students in this class
  io.to(`class_${classId}`).emit('new_assignment', {
    message: `New Assignment: ${data.title}`,
    assignmentId: assignment.id
  });

  return assignment;
};

export const getClassAssignments = async (classId: number) => {
  return await prisma.assignment.findMany({
    where: { classId },
    include: { submissions: true },
    orderBy: { createdAt: 'desc' }
  });
};

// === SUBMISSIONS ===

export const submitAssignment = async (studentId: string, assignmentId: number, file: Express.Multer.File | undefined, content?: string) => {
  const submission = await prisma.submission.create({
    data: {
      studentId,
      assignmentId,
      fileUrl: file ? file.path : null, // Store file path
      content: content || null
    }
  });

  return submission;
};

export const gradeSubmission = async (submissionId: number, grade: number, feedback: string) => {
  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: { grade, feedback }
  });

  // REAL-TIME NOTIFICATION: Notify specific student
  io.to(`student_${submission.studentId}`).emit('grade_posted', {
    message: `Your assignment has been graded.`,
    grade: grade
  });

  return submission;
};

// === MATERIALS (Lecture Slides) ===

export const uploadMaterial = async (classId: number, title: string, file: Express.Multer.File) => {
  return await prisma.subjectMaterial.create({
    data: {
      classId,
      title,
      fileUrl: file.path,
      fileType: file.mimetype
    }
  });
};

export const getClassMaterials = async (classId: number) => {
  return await prisma.subjectMaterial.findMany({
    where: { classId },
    orderBy: { createdAt: 'desc' }
  });
};