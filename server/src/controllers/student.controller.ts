// FILE: server/src/controllers/student.controller.ts
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as studentService from '../services/student.service';
import prisma from '../utils/prisma';
import { createStudentSchema, updateStudentSchema } from '../utils/validation';

/**
 * Get all students with pagination and filters
 */
export async function getStudents(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'ACTIVE';

    const result = await studentService.getAllStudents({ 
      page, 
      limit, 
      search, 
      status: status as any 
    });

    res.json({ 
      success: true, 
      ...result 
    });
  } catch (error: any) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch students'
    });
  }
}

/**
 * Get a single student by ID
 */
export async function getStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    const student = await studentService.getStudentById(id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    res.json({ 
      success: true, 
      data: student 
    });
  } catch (error: any) {
    console.error('Get student error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch student'
    });
  }
}

/**
 * Create a new student
 */
export async function createStudent(req: Request, res: Response) {
  try {
    const validatedData = createStudentSchema.parse(req.body);
    const student = await studentService.createStudent(validatedData);
    
    res.status(201).json({ 
      success: true, 
      data: student,
      message: 'Student created successfully'
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: error.issues[0].message 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create student'
    });
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    const validatedData = updateStudentSchema.parse(req.body);
    const student = await studentService.updateStudent(id, validatedData);
    
    res.json({ 
      success: true, 
      data: student,
      message: 'Student updated successfully'
    });
  } catch (error: any) {
    console.error('Update student error:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: error.issues[0].message 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update student'
    });
  }
}

/**
 * Bulk import students
 */
export async function createBulkStudents(req: Request, res: Response) {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No student data provided" 
      });
    }

    const createdCount = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let count = 0;
      const errors: string[] = [];

      for (const student of students) {
        try {
          // Check if user already exists
          const exists = await tx.user.findUnique({ 
            where: { email: student.email } 
          });

          if (exists) {
            errors.push(`Email ${student.email} already exists`);
            continue;
          }

          // Hash default password
          const hashedPassword = await bcrypt.hash("Student123", 10);

          // Create user with student profile
          await tx.user.create({
            data: {
              email: student.email,
              password: hashedPassword,
              role: 'STUDENT',
              studentProfile: {
                create: {
                  firstName: student.firstName,
                  lastName: student.lastName,
                  gender: student.gender || 'MALE',
                  dateOfBirth: student.dateOfBirth 
                    ? new Date(student.dateOfBirth) 
                    : null,
                  address: student.address || null,
                  guardianName: student.guardianName || null,
                  guardianPhone: student.guardianPhone || null
                }
              }
            }
          });

          count++;
        } catch (err: any) {
          errors.push(`Failed to create ${student.email}: ${err.message}`);
        }
      }

      return { count, errors };
    });

    res.status(201).json({ 
      success: true, 
      message: `Successfully imported ${createdCount.count} students`,
      count: createdCount.count,
      errors: createdCount.errors.length > 0 ? createdCount.errors : undefined
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to import students" 
    });
  }
}

/**
 * Toggle student active status
 */
export async function toggleStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    await studentService.toggleStudentStatus(id);
    
    res.json({ 
      success: true, 
      message: "Student status updated successfully" 
    });
  } catch (error: any) {
    console.error('Toggle status error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update status'
    });
  }
}

/**
 * Permanently delete a student
 */
export async function deleteStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    await studentService.deleteStudentPermanently(id);
    
    res.json({ 
      success: true, 
      message: "Student deleted permanently" 
    });
  } catch (error: any) {
    console.error('Delete student error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to delete student'
    });
  }
}

// Export as object
export const StudentController = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  createBulkStudents,
  toggleStatus,
  deleteStudent
};