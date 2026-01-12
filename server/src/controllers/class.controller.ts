// FILE: server/src/controllers/class.controller.ts
import { Request, Response } from 'express';
import * as classService from '../services/class.service';

/**
 * Get all classes
 */
export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await classService.getAllClasses();
    res.json({ 
      success: true, 
      data: classes,
      count: classes.length 
    });
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch classes'
    });
  }
};

/**
 * Get a single class by ID
 */
export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format (UUID)
    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const cls = await classService.getClassById(id);
    
    if (!cls) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }

    res.json({ success: true, data: cls });
  } catch (error: any) {
    console.error('Error fetching class:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch class'
    });
  }
};

/**
 * Create a new class
 */
export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, teacherId, subjectId } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Class name is required' 
      });
    }

    const newClass = await classService.createClass({
      name: name.trim(),
      teacherId: teacherId || undefined,
      subjectId: subjectId || undefined
    });

    res.status(201).json({ 
      success: true, 
      data: newClass,
      message: 'Class created successfully'
    });
  } catch (error: any) {
    console.error('Error creating class:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create class'
    });
  }
};

/**
 * Update an existing class
 */
export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, teacherId, subjectId } = req.body;

    // Validate ID
    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    // Validate at least one field to update
    if (!name && !teacherId && !subjectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one field must be provided for update' 
      });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (subjectId !== undefined) updateData.subjectId = subjectId;

    const updated = await classService.updateClass(id, updateData);

    res.json({ 
      success: true, 
      data: updated,
      message: 'Class updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating class:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }

    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update class'
    });
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    await classService.deleteClass(id);

    res.json({ 
      success: true, 
      message: 'Class deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting class:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }

    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to delete class'
    });
  }
};

/**
 * Enroll a student in a class
 */
export const enrollStudent = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    // Validation
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

    const enrollment = await classService.enrollStudent(classId, studentId);

    res.status(201).json({ 
      success: true, 
      data: enrollment,
      message: 'Student enrolled successfully'
    });
  } catch (error: any) {
    console.error('Error enrolling student:', error);
    
    // Handle specific errors
    if (error.message.includes('already enrolled')) {
      return res.status(409).json({ 
        success: false, 
        message: error.message 
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to enroll student'
    });
  }
};

/**
 * Remove a student from a class
 */
export const unenrollStudent = async (req: Request, res: Response) => {
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

    await classService.unenrollStudent(classId, studentId);

    res.json({ 
      success: true, 
      message: 'Student unenrolled successfully' 
    });
  } catch (error: any) {
    console.error('Error unenrolling student:', error);
    
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
};

/**
 * Get students enrolled in a class
 */
export const getClassStudents = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const students = await classService.getClassStudents(classId);

    res.json({ 
      success: true, 
      data: students,
      count: students.length
    });
  } catch (error: any) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch students'
    });
  }
};

/**
 * Get class statistics
 */
export const getClassStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }

    const stats = await classService.getClassStats(id);

    res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error: any) {
    console.error('Error fetching class stats:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch class statistics'
    });
  }
};

/**
 * Get form options (teachers, subjects)
 */
export const getFormOptions = async (req: Request, res: Response) => {
  try {
    const options = await classService.getFormOptions();

    res.json({ 
      success: true, 
      data: options 
    });
  } catch (error: any) {
    console.error('Error fetching form options:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch form options'
    });
  }
};

// Export as both named exports and default object for flexibility
export const ClassController = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  enrollStudent,
  unenrollStudent,
  getClassStudents,
  getClassStats,
  getFormOptions
};