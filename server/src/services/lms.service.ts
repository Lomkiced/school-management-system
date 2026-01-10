// FILE: server/src/services/lms.service.ts
import { QuestionType } from '@prisma/client';
import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

// ================= ASSIGNMENTS =================

export const createAssignment = async (classId: number, data: any, file?: Express.Multer.File) => {
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        maxScore: parseFloat(data.maxScore),
        classId: classId,
        fileUrl: file ? file.path : null,
        fileType: file ? file.mimetype : null
      }
    });

    try {
      getIO().to(`class_${classId}`).emit('new_assignment', {
        title: `New Assignment: ${data.title}`,
        assignmentId: assignment.id
      });
    } catch (e) { /* Ignore socket error */ }

    return assignment;
  });
};

export const getClassAssignments = async (classId: number, filter: string) => {
  // Simple filter logic
  return await prisma.assignment.findMany({
    where: { classId },
    include: { submissions: true },
    orderBy: { createdAt: 'desc' }
  });
};

// ================= SUBMISSIONS =================

export const submitAssignment = async (studentId: string, assignmentId: number, file: Express.Multer.File | undefined, content?: string) => {
  return await prisma.submission.upsert({
    where: { studentId_assignmentId: { studentId, assignmentId } },
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
};

export const gradeSubmission = async (submissionId: number, grade: number, feedback: string) => {
  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: { grade, feedback }
  });

  try {
    getIO().to(`student_${submission.studentId}`).emit('grade_posted', {
      message: `Grade Posted: ${grade}`,
      assignmentId: submission.assignmentId
    });
  } catch (e) { /* Ignore */ }

  return submission;
};

// ================= MATERIALS =================

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

// ================= QUIZ ENGINE (NEW) =================

export const createQuiz = async (classId: number, data: any) => {
  // Complex Transaction: Create Quiz -> Create Questions -> Create Options
  return await prisma.quiz.create({
    data: {
      classId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      passingScore: data.passingScore,
      questions: {
        create: data.questions.map((q: any) => ({
          text: q.text,
          points: q.points,
          type: q.type,
          options: {
            create: q.options.map((o: any) => ({
              text: o.text,
              isCorrect: o.isCorrect
            }))
          }
        }))
      }
    }
  });
};

export const getQuiz = async (quizId: string) => {
  return await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { options: true } // We send options to frontend (frontend must hide isCorrect!)
      }
    }
  });
};

// THE AUTO-GRADER
export const submitQuiz = async (studentId: string, quizId: string, answers: any[]) => {
  // 1. Fetch the Quiz AND the Correct Answers (Source of Truth)
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { options: true } } }
  });

  if (!quiz) throw new Error("Quiz not found");

  let totalScore = 0;
  
  // 2. Loop through every question and grade it
  const processedAnswers = answers.map(ans => {
    const question = quiz.questions.find(q => q.id === ans.questionId);
    if (!question) return null;

    let isCorrect = false;

    // Logic for Multiple Choice / True False
    if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      const correctOption = question.options.find(o => o.isCorrect);
      if (correctOption && correctOption.id === ans.selectedOptionId) {
        isCorrect = true;
      }
    } 
    // Logic for Identification (Text Match - Case Insensitive)
    else if (question.type === QuestionType.IDENTIFICATION) {
      const correctOption = question.options.find(o => o.isCorrect);
      if (correctOption && ans.textAnswer) {
        if (ans.textAnswer.trim().toLowerCase() === correctOption.text.toLowerCase()) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) totalScore += question.points;

    return {
      questionId: ans.questionId,
      selectedOptionId: ans.selectedOptionId,
      textAnswer: ans.textAnswer
    };
  }).filter(a => a !== null); // remove invalid answers

  // 3. Save the Attempt and the Score
  return await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId,
      score: totalScore,
      finishedAt: new Date(),
      answers: {
        create: processedAnswers as any 
      }
    }
  });
};