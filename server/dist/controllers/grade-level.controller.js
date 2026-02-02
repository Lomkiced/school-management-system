"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGradeLevel = exports.createGradeLevel = exports.getGradeLevels = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const gradeLevelSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    value: zod_1.z.number().int(),
    category: zod_1.z.string().optional(),
    order: zod_1.z.number().int().optional()
});
const getGradeLevels = async (req, res) => {
    try {
        let levels = await prisma_1.prisma.gradeLevel.findMany({
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
            await prisma_1.prisma.gradeLevel.createMany({ data: defaults });
            levels = await prisma_1.prisma.gradeLevel.findMany({ orderBy: { order: 'asc' } });
        }
        res.json({ success: true, data: levels });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch grade levels' });
    }
};
exports.getGradeLevels = getGradeLevels;
const createGradeLevel = async (req, res) => {
    try {
        const data = gradeLevelSchema.parse(req.body);
        // Check for duplicate value
        const existing = await prisma_1.prisma.gradeLevel.findUnique({
            where: { value: data.value }
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Grade level value already exists' });
        }
        const level = await prisma_1.prisma.gradeLevel.create({
            data
        });
        res.json({ success: true, data: level });
    }
    catch (error) {
        res.status(400).json({ success: false, message: 'Invalid data' });
    }
};
exports.createGradeLevel = createGradeLevel;
const deleteGradeLevel = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.gradeLevel.delete({ where: { id } });
        res.json({ success: true, message: 'Grade level deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete grade level' });
    }
};
exports.deleteGradeLevel = deleteGradeLevel;
