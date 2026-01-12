// FILE: server/src/controllers/lms.controller.ts
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as lmsService from '../services/lms.service';
import prisma from '../utils/prisma';
import { assignmentSchema, gradeSchema, quizSchema } from '../utils/validation';

// ================= ASSIGNMENTS =================

export async function createAssignment(req: Request, res: Response) {
  try {
    const { classId } = req.params;

    // Validate classId format
    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const validatedData = assignmentSchema.parse(req.body);
    const assignment = await lmsService.createAssignment(classId, validatedData, req.file);
    
    res.status(201).json({ 
      success: true, 
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error: any) {
    console.error('Create assignment error:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: error.issues[0].message 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create assignment'
    });
  }
}

export async function getAssignments(req: Request, res: Response) {
  try {
    const { classId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const assignments = await lmsService.getClassAssignments(classId);
    
    res.json({ 
      success: true, 
      data: assignments,
      count: assignments.length
    });
  } catch (error: any) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch assignments'
    });
  }
}

export async function getAssignmentById(req: Request, res: Response) {
  try {
    const { assignmentId } = req.params;

    if (!assignmentId || assignmentId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid assignment ID format' 
      });
    }

    const assignment = await lmsService.getAssignmentById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    res.json({ 
      success: true, 
      data: assignment 
    });
  } catch (error: any) {
    console.error('Get assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch assignment'
    });
  }
}

// ================= SUBMISSIONS =================

export async function submitAssignment(req: Request, res: Response) {
  try {
    const { assignmentId, content } = req.body;
    let { studentId } = req.body;
    
    // If studentId not provided, get it from authenticated user
    if (!studentId && req.user) {
      const student = await prisma.student.findUnique({ 
        where: { userId: req.user.id } 
      });
      
      if (student) {
        studentId = student.id;
      }
    }

    // Validation
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required or you must be logged in as a student' 
      });
    }

    if (!assignmentId || assignmentId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid assignment ID format' 
      });
    }

    if (!req.file && !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either file or text content is required' 
      });
    }

    const submission = await lmsService.submitAssignment(
      studentId, 
      assignmentId, 
      req.file, 
      content
    );
    
    res.status(201).json({ 
      success: true, 
      data: submission,
      message: 'Assignment submitted successfully'
    });
  } catch (error: any) {
    console.error('Submit assignment error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to submit assignment'
    });
  }
}

export async function gradeSubmission(req: Request, res: Response) {
  try {
    const { submissionId } = req.params;

    if (!submissionId || submissionId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid submission ID format' 
      });
    }

    const validated = gradeSchema.parse(req.body);
    
    const result = await lmsService.gradeSubmission(
      submissionId, 
      validated.grade, 
      validated.feedback
    );
    
    res.json({ 
      success: true, 
      data: result,
      message: 'Submission graded successfully'
    });
  } catch (error: any) {
    console.error('Grade submission error:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: error.issues[0].message 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to grade submission'
    });
  }
}

export async function getStudentSubmissions(req: Request, res: Response) {
  try {
    let { studentId } = req.params;

    // If no studentId in params, get from authenticated user
    if (!studentId && req.user) {
      const student = await prisma.student.findUnique({ 
        where: { userId: req.user.id } 
      });
      
      if (student) {
        studentId = student.id;
      }
    }

    if (!studentId || studentId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    const submissions = await lmsService.getStudentSubmissions(studentId);
    
    res.json({ 
      success: true, 
      data: submissions,
      count: submissions.length
    });
  } catch (error: any) {
    console.error('Get student submissions error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch submissions'
    });
  }
}

// ================= MATERIALS =================

export async function uploadMaterial(req: Request, res: Response) {
  try {
    const { classId } = req.params;
    const { title } = req.body;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File is required' 
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title is required' 
      });
    }

    const material = await lmsService.uploadMaterial(classId, title.trim(), req.file);
    
    res.status(201).json({ 
      success: true, 
      data: material,
      message: 'Material uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload material error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to upload material'
    });
  }
}

export async function getMaterials(req: Request, res: Response) {
  try {
    const { classId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const materials = await lmsService.getClassMaterials(classId);
    
    res.json({ 
      success: true, 
      data: materials,
      count: materials.length
    });
  } catch (error: any) {
    console.error('Get materials error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch materials'
    });
  }
}

export async function deleteMaterial(req: Request, res: Response) {
  try {
    const { materialId } = req.params;

    if (!materialId || materialId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid material ID format' 
      });
    }

    await lmsService.deleteMaterial(materialId);
    
    res.json({ 
      success: true, 
      message: 'Material deleted successfully' 
    });
  } catch (error: any) {
    console.error('Delete material error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to delete material'
    });
  }
}

// ================= QUIZZES =================

export async function createQuiz(req: Request, res: Response) {
  try {
    const { classId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const validatedData = quizSchema.parse(req.body);
    const quiz = await lmsService.createQuiz(classId, validatedData);
    
    res.status(201).json({ 
      success: true, 
      data: quiz,
      message: 'Quiz created successfully'
    });
  } catch (error: any) {
    console.error('Create quiz error:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: error.issues[0].message 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create quiz' 
    });
  }
}

export async function getQuiz(req: Request, res: Response) {
  try {
    const { quizId } = req.params;

    if (!quizId || quizId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid quiz ID format' 
      });
    }

    const quiz = await lmsService.getQuiz(quizId);
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz not found' 
      });
    }

    res.json({ 
      success: true, 
      data: quiz 
    });
  } catch (error: any) {
    console.error('Get quiz error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch quiz'
    });
  }
}

export async function getClassQuizzes(req: Request, res: Response) {
  try {
    const { classId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const quizzes = await lmsService.getClassQuizzes(classId);
    
    res.json({ 
      success: true, 
      data: quizzes,
      count: quizzes.length
    });
  } catch (error: any) {
    console.error('Get class quizzes error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch quizzes'
    });
  }
}

export async function submitQuiz(req: Request, res: Response) {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!quizId || quizId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid quiz ID format' 
      });
    }

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    // Find student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student profile not found. Are you logged in as a student?' 
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Answers are required' 
      });
    }

    const attempt = await lmsService.submitQuiz(student.id, quizId, answers);
    
    res.status(201).json({ 
      success: true, 
      data: attempt,
      message: 'Quiz submitted successfully'
    });
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to submit quiz'
    });
  }
}

export async function getQuizAttempts(req: Request, res: Response) {
  try {
    const { quizId } = req.params;

    if (!quizId || quizId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid quiz ID format' 
      });
    }

    const attempts = await lmsService.getQuizAttempts(quizId);
    
    res.json({ 
      success: true, 
      data: attempts,
      count: attempts.length
    });
  } catch (error: any) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch quiz attempts'
    });
  }
}

export async function getStudentQuizAttempts(req: Request, res: Response) {
  try {
    let { studentId } = req.params;

    // If no studentId, get from authenticated user
    if (!studentId && req.user) {
      const student = await prisma.student.findUnique({ 
        where: { userId: req.user.id } 
      });
      
      if (student) {
        studentId = student.id;
      }
    }

    if (!studentId || studentId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    const attempts = await lmsService.getStudentQuizAttempts(studentId);
    
    res.json({ 
      success: true, 
      data: attempts,
      count: attempts.length
    });
  } catch (error: any) {
    console.error('Get student quiz attempts error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch quiz attempts'
    });
  }
}

// Export as object for easy importing
export const LMSController = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  submitAssignment,
  gradeSubmission,
  getStudentSubmissions,
  uploadMaterial,
  getMaterials,
  deleteMaterial,
  createQuiz,
  getQuiz,
  getClassQuizzes,
  submitQuiz,
  getQuizAttempts,
  getStudentQuizAttempts
};