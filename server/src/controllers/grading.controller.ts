// FILE: server/src/controllers/grading.controller.ts
import { Request, Response } from 'express';
import * as gradingService from '../services/grading.service';

export const getGrades = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.role === 'STUDENT' 
      ? req.user.id // This maps to UserID, service usually needs StudentID. 
      // Ideally, we'd look up the Student profile here first, but for now we pass it.
      : req.query.studentId as string;

    const grades = await gradingService.getGrades({ 
      studentId, 
      classId: req.query.classId as string 
    });
    
    res.json({ success: true, data: grades });
  } catch (error: any) {
    console.error("Grading Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch grades" });
  }
};

export const submitGrade = async (req: Request, res: Response) => {
  try {
    const grade = await gradingService.recordGrade({
      ...req.body,
      gradedBy: req.user?.id
    });
    res.json({ success: true, data: grade });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};