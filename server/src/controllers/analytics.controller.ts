import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};