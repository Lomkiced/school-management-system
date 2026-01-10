import { Request, Response } from 'express';
import * as enrollmentService from '../services/enrollment.service';

export const enroll = async (req: Request, res: Response) => {
  try {
    const result = await enrollmentService.enrollStudent(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
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