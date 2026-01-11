// FILE: server/src/controllers/class.controller.ts
import { Request, Response } from 'express';
import * as classService from '../services/class.service';

// Define the functions first
const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await classService.getAllClasses();
    res.json({ success: true, data: classes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClassById = async (req: Request, res: Response) => {
  try {
    // Check if service has getById, otherwise fallback to finding in array
    // Assuming service.getClassById exists. If not, we might need to fix service next.
    const cls = await classService.getClassById(Number(req.params.id));
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, data: cls });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createClass = async (req: Request, res: Response) => {
  try {
    const newClass = await classService.createClass(req.body);
    res.status(201).json({ success: true, data: newClass });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateClass = async (req: Request, res: Response) => {
  try {
    // Assuming updateClass exists in service
    const updated = await classService.updateClass(Number(req.params.id), req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const enrollStudent = async (req: Request, res: Response) => {
  try {
    // Assuming enrollStudent exists in service
    const result = await classService.enrollStudent(Number(req.params.classId), req.body.studentId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getOptions = async (req: Request, res: Response) => {
  try {
    const options = await classService.getFormOptions();
    res.json({ success: true, data: options });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EXPORT AS A UNIFIED OBJECT (This fixes the 'has no exported member' error)
export const ClassController = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  enrollStudent,
  getOptions
};