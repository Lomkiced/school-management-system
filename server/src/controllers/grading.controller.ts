import { Request, Response } from 'express';
import * as auditService from '../services/audit.service';
import * as gradingService from '../services/grading.service';
import prisma from '../utils/prisma';

export const initialize = async (req: Request, res: Response) => {
  try {
    const terms = await gradingService.initTerms();
    res.json({ success: true, data: terms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGradebook = async (req: Request, res: Response) => {
  try {
    const data = await gradingService.getGradebook(req.params.classId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitGrade = async (req: Request, res: Response) => {
  try {
    const result = await gradingService.updateGrade(req.body);
    
    // SAFETY CHECK: Get User ID
    const user = (req as any).user;
    const userId = user?.userId || user?.id; 

    if (userId) {
      // PROFESSIONAL TOUCH: Fetch names instead of just logging IDs
      const student = await prisma.student.findUnique({ 
        where: { id: req.body.studentId } 
      });
      
      const classInfo = await prisma.class.findUnique({ 
        where: { id: parseInt(req.body.classId) },
        include: { subject: true }
      });

      const studentName = student ? `${student.lastName}, ${student.firstName}` : 'Unknown Student';
      const subjectName = classInfo ? classInfo.subject.code : 'Unknown Class';

      // Log the HUMAN READABLE message
      await auditService.logAction(
        userId, 
        'GRADE_UPDATE', 
        `Updated grade for ${studentName} in ${subjectName} to ${req.body.score}`
      );
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Grading Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};