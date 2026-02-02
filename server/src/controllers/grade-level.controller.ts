import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const gradeLevelSchema = z.object({
    label: z.string().min(1),
    value: z.number().int(),
    category: z.string().optional(),
    order: z.number().int().optional()
});

export const getGradeLevels = async (req: Request, res: Response) => {
    try {
        let levels = await prisma.gradeLevel.findMany({
            orderBy: { order: 'asc' }
        });

        // Auto-seed if empty
        if (levels.length === 0) {
            const defaults = [
                ...Array.from({ length: 6 }, (_, i) => ({ label: `Grade ${i + 1}`, value: i + 1, category: 'Elementary', order: i + 1 })),
                ...Array.from({ length: 4 }, (_, i) => ({ label: `Grade ${i + 7}`, value: i + 7, category: 'Junior High', order: i + 7 })),
                { label: 'Grade 11', value: 11, category: 'Senior High', order: 11 },
                { label: 'Grade 12', value: 12, category: 'Senior High', order: 12 },
                { label: 'College 1', value: 13, category: 'College', order: 13 },
                { label: 'College 2', value: 14, category: 'College', order: 14 },
                { label: 'College 3', value: 15, category: 'College', order: 15 },
                { label: 'College 4', value: 16, category: 'College', order: 16 },
            ];

            await prisma.gradeLevel.createMany({ data: defaults });

            levels = await prisma.gradeLevel.findMany({ orderBy: { order: 'asc' } });
        }

        res.json({ success: true, data: levels });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch grade levels' });
    }
};

export const createGradeLevel = async (req: Request, res: Response) => {
    try {
        const data = gradeLevelSchema.parse(req.body);

        // Check for duplicate value
        const existing = await prisma.gradeLevel.findUnique({
            where: { value: data.value }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Grade level value already exists' });
        }

        const level = await prisma.gradeLevel.create({
            data
        });

        res.json({ success: true, data: level });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid data' });
    }
};

export const deleteGradeLevel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.gradeLevel.delete({ where: { id } });
        res.json({ success: true, message: 'Grade level deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete grade level' });
    }
};
