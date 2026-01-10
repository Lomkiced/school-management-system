// FILE: server/src/controllers/lms.controller.ts

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as lmsService from '../services/lms.service';
import { assignmentSchema, gradeSchema } from '../utils/validation';

// Helper: Parse ID safely
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
    
    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error: any) {
    // FIX: Use .issues or cast to any to satisfy strict mode
    if (error instanceof ZodError) {
      const message = error.issues ? error.issues[0].message : 'Validation Error';
      return res.status(400).json({ success: false, message });
    }
    console.error("Create Assignment Error:", error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create assignment' });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId, 'Class');
    const filter = (req.query.filter as 'all' | 'active' | 'past') || 'all';
    
    const assignments = await lmsService.getClassAssignments(classId, filter);
    
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= SUBMISSIONS =================

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { studentId, assignmentId, content } = req.body;
    
    if (!studentId || !assignmentId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const pAssignmentId = parseId(assignmentId, 'Assignment');

    const submission = await lmsService.submitAssignment(
      studentId, 
      pAssignmentId, 
      req.file, 
      content
    );
    
    res.status(201).json({ success: true, data: submission });
  } catch (error: any) {
    console.error("Submission Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const submissionId = parseId(req.params.submissionId, 'Submission');
    const validatedGrade = gradeSchema.parse(req.body);
    
    const result = await lmsService.gradeSubmission(
      submissionId, 
      validatedGrade.grade, 
      validatedGrade.feedback || ''
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    // FIX: Use .issues for strict type safety
    if (error instanceof ZodError) {
      const message = error.issues ? error.issues[0].message : 'Validation Error';
      return res.status(400).json({ success: false, message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= MATERIALS =================

export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId, 'Class');
    const { title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!title) {
       return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const material = await lmsService.uploadMaterial(classId, title, req.file);
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