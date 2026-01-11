// FILE: server/src/controllers/teacher.controller.ts
import { Request, Response } from 'express';
import * as teacherService from '../services/teacher.service';

const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await teacherService.getAllTeachers();
    res.json({ success: true, data: teachers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeacherById = async (req: Request, res: Response) => {
  try {
    // Assuming service method exists
    const teacher = await teacherService.getTeacherById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
    res.json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTeacher = async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.createTeacher(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTeacher = async (req: Request, res: Response) => {
  try {
    // Assuming service method exists
    const teacher = await teacherService.updateTeacher(req.params.id, req.body);
    res.json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// EXPORT AS UNIFIED OBJECT
export const TeacherController = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher
};