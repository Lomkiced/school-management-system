// FILE: server/src/controllers/enrollment.controller.ts
import { Request, Response } from 'express';
import * as enrollmentService from '../services/enrollment.service';

/**
 * Enroll multiple students in a class (bulk enrollment)
 */
export async function enrollBulk(req: Request, res: Response) {
  try {
    const { classId, studentIds } = req.body;

    // Validation
    if (!classId || classId.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Class ID is required" 
      });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please select at least one student" 
      });
    }

    // Validate all student IDs are strings
    const invalidIds = studentIds.filter(id => typeof id !== 'string' || id.trim().length === 0);
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "All student IDs must be valid strings" 
      });
    }

    const result = await enrollmentService.enrollStudentBulk(classId, studentIds);
    
    res.status(201).json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error("Bulk enrollment error:", error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to enroll students'
    });
  }
}

/**
 * Get enrollments for a specific class
 */
export async function getEnrollmentsByClass(req: Request, res: Response) {
  try {
    const { classId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const enrollments = await enrollmentService.getEnrollmentsByClass(classId);
    
    res.json({ 
      success: true, 
      data: enrollments,
      count: enrollments.length
    });
  } catch (error: any) {
    console.error("Get enrollments by class error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch enrollments'
    });
  }
}

/**
 * Get enrollments for a specific student
 */
export async function getEnrollmentsByStudent(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    if (!studentId || studentId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    const enrollments = await enrollmentService.getEnrollmentsByStudent(studentId);
    
    res.json({ 
      success: true, 
      data: enrollments,
      count: enrollments.length
    });
  } catch (error: any) {
    console.error("Get enrollments by student error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch enrollments'
    });
  }
}

/**
 * Get options for enrollment forms (students and classes)
 */
export async function getOptions(req: Request, res: Response) {
  try {
    const options = await enrollmentService.getEnrollmentOptions();
    
    res.json({ 
      success: true, 
      data: options 
    });
  } catch (error: any) {
    console.error("Get enrollment options error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch enrollment options'
    });
  }
}

/**
 * Unenroll a student from a class
 */
export async function unenrollStudent(req: Request, res: Response) {
  try {
    const { classId, studentId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    if (!studentId || studentId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    await enrollmentService.unenrollStudent(classId, studentId);
    
    res.json({ 
      success: true, 
      message: 'Student unenrolled successfully' 
    });
  } catch (error: any) {
    console.error("Unenroll student error:", error);
    
    if (error.message.includes('not enrolled')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to unenroll student'
    });
  }
}

/**
 * Get enrollment statistics
 */
export async function getEnrollmentStats(req: Request, res: Response) {
  try {
    const stats = await enrollmentService.getEnrollmentStats();
    
    res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error: any) {
    console.error("Get enrollment stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch enrollment statistics'
    });
  }
}

/**
 * Transfer a student from one class to another
 */
export async function transferStudent(req: Request, res: Response) {
  try {
    const { studentId, fromClassId, toClassId } = req.body;

    // Validation
    if (!studentId || studentId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    if (!fromClassId || fromClassId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid source class ID format' 
      });
    }

    if (!toClassId || toClassId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid destination class ID format' 
      });
    }

    if (fromClassId === toClassId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Source and destination classes must be different' 
      });
    }

    const enrollment = await enrollmentService.transferStudent(studentId, fromClassId, toClassId);
    
    res.json({ 
      success: true, 
      data: enrollment,
      message: 'Student transferred successfully' 
    });
  } catch (error: any) {
    console.error("Transfer student error:", error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    if (error.message.includes('not enrolled') || error.message.includes('already enrolled')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to transfer student'
    });
  }
}

// Export as both named exports and object
export const EnrollmentController = {
  enrollBulk,
  getEnrollmentsByClass,
  getEnrollmentsByStudent,
  getOptions,
  unenrollStudent,
  getEnrollmentStats,
  transferStudent
};