import { Request, Response } from 'express';
import * as teacherService from '../services/teacher.service';

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await teacherService.getAllTeachers();
    res.json({ success: true, data: teachers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.createTeacher(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};