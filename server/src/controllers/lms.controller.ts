import { Request, Response } from 'express';
import * as lmsService from '../services/lms.service';

// Create Assignment
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    const assignment = await lmsService.createAssignment(classId, req.body);
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

// Get Assignments
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    const assignments = await lmsService.getClassAssignments(classId);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

// Submit Assignment (Student)
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { studentId, assignmentId, content } = req.body;
    // req.file comes from Multer middleware
    const submission = await lmsService.submitAssignment(
      studentId, 
      parseInt(assignmentId), 
      req.file, 
      content
    );
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

// Grade Submission (Teacher)
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { grade, feedback } = req.body;
    const submissionId = parseInt(req.params.submissionId);
    const result = await lmsService.gradeSubmission(submissionId, parseFloat(grade), feedback);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

// Upload Material
export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    const { title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const material = await lmsService.uploadMaterial(classId, title, req.file);
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload material' });
  }
};

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId);
    const materials = await lmsService.getClassMaterials(classId);
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};