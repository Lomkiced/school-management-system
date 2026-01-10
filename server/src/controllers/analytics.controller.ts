import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve analytics data' 
    });
  }
};