// FILE: server/src/controllers/parent.controller.ts
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as parentService from '../services/parent.service';
import { createParentSchema, linkStudentSchema, updateParentSchema } from '../utils/validation';

export const getParents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const result = await parentService.getAllParents({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createParent = async (req: Request, res: Response) => {
  try {
    const validated = createParentSchema.parse(req.body);
    const parent = await parentService.createParent(validated);
    res.status(201).json({ success: true, data: parent });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ success: false, message: error.issues[0].message });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateParent = async (req: Request, res: Response) => {
  try {
    const validated = updateParentSchema.parse(req.body);
    const parent = await parentService.updateParent(req.params.id, validated);
    res.json({ success: true, data: parent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const linkStudents = async (req: Request, res: Response) => {
  try {
    const { studentIds } = linkStudentSchema.parse(req.body);
    await parentService.linkStudentsToParent(req.params.id, studentIds);
    res.json({ success: true, message: "Students linked successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteParent = async (req: Request, res: Response) => {
  try {
    await parentService.deleteParent(req.params.id);
    res.json({ success: true, message: "Parent deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};