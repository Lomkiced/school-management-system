import { getIO } from '../lib/socket'; // <--- Import from lib
import prisma from '../utils/prisma';

// === ASSIGNMENTS ===

export const createAssignment = async (classId: number, data: any, file?: Express.Multer.File) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Create Assignment
    const assignment = await tx.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        maxScore: parseFloat(data.maxScore),
        classId: classId,
        fileUrl: file ? file.path : null, // Store path if file exists
        fileType: file ? file.mimetype : null
      }
    });

    // 2. Notify Students (Safe Socket Call)
    try {
      getIO().to(`class_${classId}`).emit('new_assignment', {
        title: `New Assignment: ${data.title}`,
        assignmentId: assignment.id,
        dueDate: assignment.dueDate
      });
    } catch (e) {
      console.warn("Socket not ready, skipping notification");
    }

    return assignment;
  });
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
  // Logic: Use Upsert to allow re-submissions
  const submission = await prisma.submission.upsert({
    where: {
      studentId_assignmentId: {
        studentId,
        assignmentId
      }
    },
    update: {
      fileUrl: file ? file.path : undefined,
      content: content || undefined,
      submittedAt: new Date()
    },
    create: {
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

  // Notify Student
  try {
    getIO().to(`student_${submission.studentId}`).emit('grade_posted', {
      message: `New Grade: ${grade}`,
      assignmentId: submission.assignmentId,
      feedback
    });
  } catch (e) {
    console.warn("Socket not ready");
  }

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