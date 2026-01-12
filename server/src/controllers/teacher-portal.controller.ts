// FILE: server/src/controllers/teacher-portal.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID missing");

    // 1. Get Teacher Profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: { classes: true }
    });

    if (!teacher) return res.status(404).json({ success: false, message: "Teacher profile not found" });

    // 2. Calculate Stats
    const totalClasses = teacher.classes.length;
    // Mocking other stats for now - you can expand this with real DB queries
    const totalStudents = 0; 
    const pendingGrades = 0; 

    res.json({
      success: true,
      data: {
        totalClasses,
        totalStudents,
        attendanceRate: 100,
        pendingGrades
      }
    });
  } catch (error: any) {
    console.error("Teacher Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClasses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Find teacher by User ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        _count: { select: { enrollments: true } }
      }
    });

    res.json({ success: true, data: classes });
  } catch (error: any) {
    console.error("Get Classes Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};