// FILE: server/src/controllers/enrollment.controller.ts
import { Request, Response } from 'express';
import * as enrollmentService from '../services/enrollment.service';

export const enrollBulk = async (req: Request, res: Response) => {
  try {
    const { sectionId, studentIds } = req.body;

    // Basic Validation
    if (!sectionId) {
      return res.status(400).json({ success: false, message: "Section ID is required" });
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Please select at least one student." });
    }

    const result = await enrollmentService.enrollStudentBulk(parseInt(sectionId), studentIds);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Enrollment Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOptions = async (req: Request, res: Response) => {
  try {
    const options = await enrollmentService.getEnrollmentOptions();
    res.json({ success: true, data: options });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};