// FILE: server/src/controllers/grading.controller.ts
// 2026 Standard: Comprehensive grading controller

import { Request, Response } from 'express';
import * as gradingService from '../services/grading.service';

/**
 * Get complete gradebook for a class
 * Returns classInfo, enrolled students, terms, and all grades
 */
export const getGradebook = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    if (!classId || classId.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const gradebook = await gradingService.getGradebook(classId);

    res.json({
      success: true,
      data: gradebook
    });
  } catch (error: any) {
    console.error("Gradebook Error:", error);

    if (error.message === 'Class not found') {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch gradebook'
    });
  }
};

/**
 * Get grades with filters (for student portal, reports, etc.)
 */
export const getGrades = async (req: Request, res: Response) => {
  try {
    // For students, get their own grades
    // For teachers/admins, get by query params
    let studentId = req.query.studentId as string | undefined;

    if (req.user?.role === 'STUDENT') {
      // Need to look up the student profile from user ID
      // For now, pass the user ID (should be mapped to student in service)
      studentId = req.user.id;
    }

    const grades = await gradingService.getGrades({
      studentId,
      classId: req.query.classId as string
    });

    res.json({
      success: true,
      data: grades,
      count: grades.length
    });
  } catch (error: any) {
    console.error("Get Grades Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch grades'
    });
  }
};

/**
 * Submit or update a grade
 */
export const submitGrade = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, termId, score, feedback } = req.body;

    // Validation
    if (!studentId || !classId || !termId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Class ID, and Term ID are required'
      });
    }

    if (score === undefined || score === null || score === '') {
      return res.status(400).json({
        success: false,
        message: 'Score is required'
      });
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({
        success: false,
        message: 'Score must be a number between 0 and 100'
      });
    }

    const grade = await gradingService.recordGrade({
      studentId,
      classId,
      termId,
      score: numericScore,
      feedback,
      gradedBy: req.user?.id
    });

    res.json({
      success: true,
      data: grade,
      message: 'Grade saved successfully'
    });
  } catch (error: any) {
    console.error("Submit Grade Error:", error);

    if (error.message.includes('not enrolled')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save grade'
    });
  }
};