import { Request, Response } from 'express';
import * as classService from '../services/class.service';

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await classService.getAllClasses();
    res.json({ success: true, data: classes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const newClass = await classService.createClass(req.body);
    res.status(201).json({ success: true, data: newClass });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOptions = async (req: Request, res: Response) => {
  try {
    const options = await classService.getFormOptions();
    res.json({ success: true, data: options });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};