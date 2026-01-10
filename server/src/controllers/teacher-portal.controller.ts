import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMyClasses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // 1. Find the Teacher Profile linked to this User
    const teacher = await prisma.teacher.findUnique({
      where: { userId }
    });

    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });

    // 2. Get Classes assigned to this Teacher
    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        section: true,
        _count: { select: { grades: true } } // Count how many grades submitted
      }
    });

    res.json({ success: true, data: classes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};