"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyClasses = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getMyClasses = async (req, res) => {
    try {
        const userId = req.user.userId;
        // 1. Find the Teacher Profile linked to this User
        const teacher = await prisma_1.default.teacher.findUnique({
            where: { userId }
        });
        if (!teacher)
            return res.status(404).json({ message: "Teacher profile not found" });
        // 2. Get Classes assigned to this Teacher
        const classes = await prisma_1.default.class.findMany({
            where: { teacherId: teacher.id },
            include: {
                subject: true,
                section: true,
                _count: { select: { grades: true } } // Count how many grades submitted
            }
        });
        res.json({ success: true, data: classes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyClasses = getMyClasses;
