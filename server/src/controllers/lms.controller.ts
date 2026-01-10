import { Request, Response } from 'express';
import * as lmsService from '../services/lms.service';

// Create Assignment (Now supports File Attachments)
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    
    // req.file is populated if the teacher uploaded an attachment
    const assignment = await lmsService.createAssignment(classId, req.body, req.file);
    
    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error("Create Assignment Error:", error);
    res.status(500).json({ success: false, message: 'Failed to create assignment' });
  }
};

// Get Assignments with Filtering
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    const filter = (req.query.filter as 'all' | 'active' | 'past') || 'all';
    
    const assignments = await lmsService.getClassAssignments(classId, filter);
    
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
};

// Submit Assignment
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { studentId, assignmentId, content } = req.body;
    
    if (!studentId || !assignmentId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const submission = await lmsService.submitAssignment(
      studentId, 
      parseInt(assignmentId), 
      req.file, 
      content
    );
    
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ success: false, message: 'Failed to submit assignment' });
  }
};

// Grade Submission
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { grade, feedback } = req.body;
    const submissionId = parseInt(req.params.submissionId);
    
    const result = await lmsService.gradeSubmission(submissionId, parseFloat(grade), feedback);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to grade submission' });
  }
};

// Upload Material
export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    const { title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const material = await lmsService.uploadMaterial(classId, title, req.file);
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload material' });
  }
};

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    const materials = await lmsService.getClassMaterials(classId);
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch materials' });
  }
};