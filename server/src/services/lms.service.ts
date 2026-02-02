// FILE: server/src/services/lms.service.ts
import { QuestionType } from '@prisma/client';
import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

// ================= TYPE DEFINITIONS =================

interface AssignmentData {
  title: string;
  description?: string;
  dueDate: string;
  maxScore: string | number;
}

interface FileUpload {
  path: string;
  mimetype: string;
}

interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  text: string;
  points: number;
  type: QuestionType;
  options: QuizQuestionOption[];
}

interface QuizData {
  title: string;
  description?: string;
  duration: number;
  passingScore: number;
  questions: QuizQuestion[];
}

interface QuizAnswerSubmission {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

// ================= ASSIGNMENTS =================

export async function createAssignment(
  classId: string,
  data: AssignmentData,
  file?: FileUpload
) {
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        maxScore: parseFloat(data.maxScore.toString()),
        classId: classId,
        fileUrl: file ? file.path : null,
        fileType: file ? file.mimetype : null
      }
    });

    // Real-time notification via Socket.io
    try {
      getIO().to(`class_${classId}`).emit('new_assignment', {
        title: `New Assignment: ${data.title}`,
        assignmentId: assignment.id
      });
    } catch (e) {
      console.error('Socket notification failed:', e);
    }

    return assignment;
  });
}

export async function getClassAssignments(classId: string, filter?: string) {
  return await prisma.assignment.findMany({
    where: { classId },
    include: {
      submissions: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      class: {
        select: {
          name: true,
          subject: {
            select: {
              name: true,
              code: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAssignmentById(assignmentId: string) {
  return await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      submissions: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      class: {
        select: {
          name: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });
}

// ================= SUBMISSIONS =================

export async function submitAssignment(
  studentId: string,
  assignmentId: string,
  file?: FileUpload,
  content?: string
) {
  return await prisma.submission.upsert({
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
    },
    include: {
      assignment: {
        select: {
          title: true,
          maxScore: true
        }
      }
    }
  });
}

export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback?: string
) {
  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade,
      feedback,
      gradedAt: new Date()
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      assignment: {
        select: {
          title: true,
          maxScore: true
        }
      }
    }
  });

  // Real-time notification
  try {
    getIO().to(`student_${submission.studentId}`).emit('grade_posted', {
      message: `Grade Posted: ${grade}`,
      assignmentId: submission.assignmentId
    });
  } catch (e) {
    console.error('Socket notification failed:', e);
  }

  return submission;
}

export async function getStudentSubmissions(studentId: string) {
  return await prisma.submission.findMany({
    where: { studentId },
    include: {
      assignment: {
        select: {
          title: true,
          dueDate: true,
          maxScore: true,
          class: {
            select: {
              name: true,
              subject: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });
}

// ================= MATERIALS =================

export async function uploadMaterial(
  classId: string,
  title: string,
  file: FileUpload
) {
  return await prisma.subjectMaterial.create({
    data: {
      classId,
      title,
      fileUrl: file.path,
      fileType: file.mimetype
    },
    include: {
      class: {
        select: {
          name: true,
          subject: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
}

export async function getClassMaterials(classId: string) {
  return await prisma.subjectMaterial.findMany({
    where: { classId },
    include: {
      class: {
        select: {
          name: true,
          subject: {
            select: {
              name: true,
              code: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function deleteMaterial(materialId: string) {
  return await prisma.subjectMaterial.delete({
    where: { id: materialId }
  });
}

// ================= QUIZ ENGINE =================

export async function createQuiz(classId: string, data: QuizData) {
  return await prisma.quiz.create({
    data: {
      classId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      passingScore: data.passingScore,
      questions: {
        create: data.questions.map((q) => ({
          text: q.text,
          points: q.points,
          type: q.type,
          options: {
            create: q.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect
            }))
          }
        }))
      }
    },
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  });
}

export async function getQuiz(quizId: string) {
  return await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      class: {
        select: {
          name: true,
          subject: {
            select: {
              name: true
            }
          }
        }
      },
      questions: {
        include: {
          options: true
        }
      }
    }
  });
}

export async function getClassQuizzes(classId: string) {
  return await prisma.quiz.findMany({
    where: { classId },
    include: {
      _count: {
        select: {
          attempts: true,
          questions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// ================= QUIZ AUTO-GRADER =================

export async function submitQuiz(
  studentId: string,
  quizId: string,
  answers: QuizAnswerSubmission[]
) {
  // 1. Fetch the Quiz with correct answers
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: {
          options: true
        }
      },
      class: {
        include: {
          subject: true
        }
      }
    }
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Get student info for notification
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    throw new Error("Student not found");
  }

  let totalScore = 0;
  const maxPossibleScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  // 2. Grade each answer
  const processedAnswers = answers.map(ans => {
    const question = quiz.questions.find((q) => q.id === ans.questionId);
    if (!question) return null;

    let isCorrect = false;

    // Multiple Choice / True False
    if (
      question.type === QuestionType.MULTIPLE_CHOICE ||
      question.type === QuestionType.TRUE_FALSE
    ) {
      const correctOption = question.options.find((o) => o.isCorrect);
      if (correctOption && correctOption.id === ans.selectedOptionId) {
        isCorrect = true;
      }
    }

    // Identification (Text Match - Case Insensitive)
    else if (question.type === QuestionType.IDENTIFICATION) {
      const correctOption = question.options.find((o) => o.isCorrect);
      if (correctOption && ans.textAnswer) {
        if (ans.textAnswer.trim().toLowerCase() === correctOption.text.toLowerCase()) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      totalScore += question.points;
    }

    return {
      questionId: ans.questionId,
      selectedOptionId: ans.selectedOptionId,
      textAnswer: ans.textAnswer
    };
  }).filter((a): a is NonNullable<typeof a> => a !== null);

  // Calculate percentage score
  const percentageScore = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;

  // 3. Save the attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId,
      score: totalScore,
      finishedAt: new Date(),
      answers: {
        create: processedAnswers
      }
    },
    include: {
      quiz: {
        select: {
          title: true,
          passingScore: true
        }
      },
      answers: {
        include: {
          question: true,
          selectedOption: true
        }
      }
    }
  });

  // ================= AUTO-POST TO GRADEBOOK =================
  // Get current term
  const currentTerm = await prisma.term.findFirst({
    where: {
      academicYear: { isCurrent: true }
    },
    orderBy: { name: 'asc' }
  });

  if (currentTerm) {
    try {
      // Check if grade entry already exists for this quiz
      const existingGrade = await prisma.grade.findFirst({
        where: {
          studentId,
          classId: quiz.classId,
          termId: currentTerm.id,
          gradeType: 'QUIZ',
          feedback: { contains: quiz.title }
        }
      });

      if (existingGrade) {
        // Update existing quiz grade (retake scenario)
        await prisma.grade.update({
          where: { id: existingGrade.id },
          data: {
            score: percentageScore,
            feedback: `Quiz: ${quiz.title} - Score: ${totalScore}/${maxPossibleScore}`
          }
        });
      } else {
        // Create new grade entry
        await prisma.grade.create({
          data: {
            studentId,
            classId: quiz.classId,
            termId: currentTerm.id,
            score: percentageScore,
            gradeType: 'QUIZ',
            weight: 1.0,
            feedback: `Quiz: ${quiz.title} - Score: ${totalScore}/${maxPossibleScore}`
          }
        });
      }

      console.log(`✅ Quiz score auto-posted to gradebook: ${student.firstName} ${student.lastName} - ${percentageScore}%`);
    } catch (error) {
      console.error('Failed to auto-post quiz grade:', error);
    }
  }

  // ================= NOTIFY STUDENT =================
  try {
    const { createNotification } = await import('./notification.service');

    const passed = percentageScore >= quiz.passingScore;
    const statusEmoji = passed ? '🎉' : '📝';

    await createNotification({
      userId: student.userId,
      type: 'QUIZ_RESULT',
      title: `${statusEmoji} Quiz Result: ${quiz.title}`,
      message: `You scored ${percentageScore}% (${totalScore}/${maxPossibleScore} points). ${passed ? 'Congratulations, you passed!' : `Passing score is ${quiz.passingScore}%.`}`,
      link: `/student/quizzes/${quizId}/results`,
      metadata: {
        quizId,
        attemptId: attempt.id,
        score: percentageScore,
        passed
      }
    });

    // Real-time socket notification
    getIO().to(`student_${student.userId}`).emit('quiz_result', {
      quizId,
      title: quiz.title,
      score: percentageScore,
      passed
    });
  } catch (e) {
    console.error('Quiz notification failed:', e);
  }

  return {
    ...attempt,
    percentageScore,
    maxPossibleScore,
    passed: percentageScore >= quiz.passingScore
  };
}

export async function getQuizAttempts(quizId: string) {
  return await prisma.quizAttempt.findMany({
    where: { quizId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      quiz: {
        select: {
          title: true,
          passingScore: true
        }
      }
    },
    orderBy: { finishedAt: 'desc' }
  });
}

export async function getStudentQuizAttempts(studentId: string) {
  return await prisma.quizAttempt.findMany({
    where: { studentId },
    include: {
      quiz: {
        select: {
          title: true,
          passingScore: true,
          class: {
            select: {
              name: true,
              subject: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { finishedAt: 'desc' }
  });
}