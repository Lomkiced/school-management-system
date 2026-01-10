import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as studentService from '../services/student.service';
import prisma from '../utils/prisma';

// ... Keep your existing getStudents, getStudent, createStudent functions ...
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
    const student = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// === THIS IS THE FIXED BULK IMPORT FUNCTION ===
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
                // FIXED: Added missing required fields
                admissionDate: new Date(),
                dateOfBirth: new Date('2000-01-01') // Default Birthday
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