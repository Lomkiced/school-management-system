// FILE: server/src/controllers/student.controller.ts
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as studentService from '../services/student.service';
import prisma from '../utils/prisma';
import { createStudentSchema, updateStudentSchema } from '../utils/validation';

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await studentService.getAllStudents();
    res.json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudent = async (req: Request, res: Response) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    // PROFESSIONAL: Validate Input
    const validatedData = createStudentSchema.parse(req.body);
    
    const student = await studentService.createStudent(validatedData);
    res.status(201).json({ success: true, data: student });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ success: false, message: error.issues[0].message });
    res.status(400).json({ success: false, message: error.message });
  }
};

// === NEW: UPDATE ENDPOINT ===
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const validatedData = updateStudentSchema.parse(req.body);
    const student = await studentService.updateStudent(req.params.id, validatedData);
    res.json({ success: true, data: student });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ success: false, message: error.issues[0].message });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createBulkStudents = async (req: Request, res: Response) => {
  try {
    const students = req.body.students;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: "No student data provided" });
    }

    const createdCount = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let count = 0;
      
      for (const student of students) {
        const exists = await tx.user.findUnique({ where: { email: student.email } });
        if (exists) continue;

        const hashedPassword = await bcrypt.hash("Student123", 10);

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
                admissionDate: new Date(),
                dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : new Date('2000-01-01')
              }
            }
          }
        });
        count++;
      }
      return count;
    });

    res.status(201).json({ 
      success: true, 
      message: `Successfully imported ${createdCount} students`, 
      count: createdCount 
    });

  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    res.status(500).json({ success: false, message: "Failed to import students" });
  }
};