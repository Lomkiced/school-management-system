// FILE: server/src/controllers/lms.controller.ts
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as lmsService from '../services/lms.service';
import prisma from '../utils/prisma';
import { assignmentSchema, gradeSchema, quizSchema } from '../utils/validation';

const parseId = (id: string, name: string) => {
  const parsed = parseInt(id);
  if (isNaN(parsed)) throw new Error(`Invalid ${name} ID`);
  return parsed;
};

// ================= ASSIGNMENTS =================

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId, 'Class');
    const validatedData = assignmentSchema.parse(req.body);
    const assignment = await lmsService.createAssignment(classId, validatedData, req.file);
    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ success: false, message: error.issues[0].message });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId, 'Class');
    const assignments = await lmsService.getClassAssignments(classId, 'all');
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= SUBMISSIONS =================

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { studentId, assignmentId, content } = req.body;
    
    // Fallback: If studentId is missing, try to find it from the User Token
    let finalStudentId = studentId;
    
    // FIX 1: Use req.user.id instead of req.user.userId
    if (!finalStudentId && req.user) {
        const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (student) finalStudentId = student.id;
    }

    if (!finalStudentId || !assignmentId) return res.status(400).json({ success: false, message: "Missing fields" });
    
    const submission = await lmsService.submitAssignment(finalStudentId, parseInt(assignmentId), req.file, content);
    res.status(201).json({ success: true, data: submission });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const submissionId = parseId(req.params.submissionId, 'Submission');
    const validated = gradeSchema.parse(req.body);
    const result = await lmsService.gradeSubmission(submissionId, validated.grade, validated.feedback || '');
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= MATERIALS =================

export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId, 'Class');
    if (!req.file || !req.body.title) return res.status(400).json({ success: false, message: 'File and Title required' });
    const material = await lmsService.uploadMaterial(classId, req.body.title, req.file);
    res.status(201).json({ success: true, data: material });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId, 'Class');
    const materials = await lmsService.getClassMaterials(classId);
    res.json({ success: true, data: materials });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= QUIZZES =================

export const createQuiz = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId, 'Class');
    const validatedData = quizSchema.parse(req.body);
    const quiz = await lmsService.createQuiz(classId, validatedData);
    res.status(201).json({ success: true, data: quiz });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ success: false, message: error.issues[0].message });
    res.status(400).json({ success: false, message: 'Failed to create quiz' });
  }
};

export const getQuiz = async (req: Request, res: Response) => {
  try {
    const quiz = await lmsService.getQuiz(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    res.json({ success: true, data: quiz });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    const quizId = req.params.quizId;
    
    // FIX 2: Use req.user?.id instead of req.user?.userId
    const userId = req.user?.id; 

    if (!userId) {
       return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Find the Student Profile associated with this User
    const student = await prisma.student.findUnique({
        where: { userId: userId }
    });

    if (!student) {
        return res.status(400).json({ success: false, message: "Student profile not found. Are you logged in as a student?" });
    }
    
    // 2. Submit using the correct Student ID
    const attempt = await lmsService.submitQuiz(student.id, quizId, answers);
    res.status(201).json({ success: true, data: attempt });
  } catch (error: any) {
    console.error("Quiz Submit Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};