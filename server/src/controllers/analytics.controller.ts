// FILE: server/src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';

// Admin Dashboard
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Strict Security Check
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Access Denied: Admins Only" });
    }

    const data = await analyticsService.getAdminDashboardStats();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Teacher Dashboard
export const getTeacherDashboard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'TEACHER') {
      return res.status(403).json({ message: "Access Denied: Teachers Only" });
    }

    const data = await analyticsService.getTeacherAnalytics(user.userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};