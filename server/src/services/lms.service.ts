import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

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

  // FIX: Use getIO() instead of direct export
  getIO().to(`class_${classId}`).emit('new_assignment', {
    message: `New Assignment: ${data.title}`,
    assignmentId: assignment.id
  });

  return assignment;
};

/**
 * Fetch assignments with advanced filtering (Active vs Past).
 */
export const getClassAssignments = async (classId: number, filter: 'all' | 'active' | 'past' = 'all') => {
  const now = new Date();
  
  const whereClause: any = { classId };
  if (filter === 'active') whereClause.dueDate = { gte: now };
  if (filter === 'past') whereClause.dueDate = { lt: now };

  return await prisma.assignment.findMany({
    where: whereClause,
    include: { 
      submissions: {
        select: { id: true, studentId: true, status: true, grade: true } // Optimization: Don't fetch full blobs
      } 
    },
    orderBy: { dueDate: 'asc' } // Show nearest due date first
  });
};

// === SUBMISSIONS ===

export const submitAssignment = async (studentId: string, assignmentId: number, file: Express.Multer.File | undefined, content?: string) => {
  const submission = await prisma.submission.create({
    data: {
      studentId,
      assignmentId,
      fileUrl: file ? file.path : null,
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

  // FIX: Use getIO() here too
  getIO().to(`student_${submission.studentId}`).emit('grade_posted', {
    message: `Your assignment has been graded.`,
    grade: grade
  });

  return submission;
};

// === MATERIALS ===

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