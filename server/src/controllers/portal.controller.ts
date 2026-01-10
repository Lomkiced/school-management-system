import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMyGrades = async (req: Request, res: Response) => {
  try {
    // 1. Get the logged-in User's ID from the Token (req.body.user is set by auth middleware)
    // Note: In a real app, we'd use a proper middleware to attach 'user' to 'req'. 
    // For now, we will decode the token manually in the service or trust the middleware we built.
    // Assuming you have a middleware that puts the decoded token in `req.body.user` or `req.user`
    
    // Let's rely on finding the student profile linked to the User ID
    // We need to pass the userId via the route or middleware.
    // For this capstone, let's fetch based on the 'userId' stored in the JWT.
    
    // FIX: We need to find the Student ID based on the User ID
    // We assume the auth middleware attaches `user` to the request object. 
    // Since we haven't strictly typed the middleware yet, we will look up the student by the User ID from the token.
    
    // NOTE: If you haven't implemented a middleware that adds `req.user`, 
    // we need to rely on the token passed in headers.
    
    // For simplicity in this step, let's assume the Frontend sends the StudentID or we fetch it.
    // BETTER APPROACH: Fetch Student by User ID.
    
    // We will cheat slightly and pass the 'userId' in the params or body for now, 
    // OR ideally, extract it from the token. 
    // Let's use the robust method: Find Student by User ID (which we'll get from the decoded token logic).
    
    // For this specific file, let's assume we implement a specific route that uses the User ID.
    
    const userId = (req as any).user?.userId; // This comes from the Auth Middleware

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        grades: {
          include: {
            class: {
              include: { subject: true, teacher: true }
            },
            term: true
          }
        }
      }
    });

    if (!student) return res.status(404).json({ message: "Student profile not found" });

    // Transform data for the Report Card
    const reportCard = student.grades.map(g => ({
      subject: g.class.subject.name,
      code: g.class.subject.code,
      teacher: `${g.class.teacher.lastName}, ${g.class.teacher.firstName}`,
      term: g.term.name,
      score: g.score
    }));

    res.json({ success: true, data: reportCard });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};