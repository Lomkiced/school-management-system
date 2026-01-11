// FILE: server/src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
  }
};

export const getCharts = async (req: Request, res: Response) => {
  try {
    const chartData = await analyticsService.getFinancialChartData();
    res.json({ success: true, data: chartData });
  } catch (error: any) {
    console.error("Chart Error:", error);
    res.status(500).json({ success: false, message: "Failed to load charts" });
  }
};