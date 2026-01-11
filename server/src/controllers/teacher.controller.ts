// FILE: server/src/controllers/teacher.controller.ts
import { Request, Response } from 'express';
import * as teacherService from '../services/teacher.service';

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'ACTIVE';

    const result = await teacherService.getAllTeachers({ 
      page, limit, search, status: status as any 
    });
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherById = async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.getTeacherById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
    res.json({ success: true, data: teacher });
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

export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.updateTeacher(req.params.id, req.body);
    res.json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// === NEW: Status Toggle ===
export const toggleStatus = async (req: Request, res: Response) => {
  try {
    await teacherService.toggleTeacherStatus(req.params.id);
    res.json({ success: true, message: "Teacher status updated" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Export as Object
export const TeacherController = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  toggleStatus
};