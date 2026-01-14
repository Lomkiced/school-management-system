"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClasses = exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new Error("User ID missing");
        // 1. Get Teacher Profile
        const teacher = await prisma_1.default.teacher.findUnique({
            where: { userId },
            include: { classes: true }
        });
        if (!teacher)
            return res.status(404).json({ success: false, message: "Teacher profile not found" });
        // 2. Calculate Stats
        const totalClasses = teacher.classes.length;
        // Mocking other stats for now - you can expand this with real DB queries
        const totalStudents = 0;
        const pendingGrades = 0;
        res.json({
            success: true,
            data: {
                totalClasses,
                totalStudents,
                attendanceRate: 100,
                pendingGrades
            }
        });
    }
    catch (error) {
        console.error("Teacher Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const getClasses = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Find teacher by User ID
        const teacher = await prisma_1.default.teacher.findUnique({
            where: { userId },
            select: { id: true }
        });
        if (!teacher)
            return res.status(404).json({ success: false, message: "Teacher not found" });
        const classes = await prisma_1.default.class.findMany({
            where: { teacherId: teacher.id },
            include: {
                subject: true,
                _count: { select: { enrollments: true } }
            }
        });
        res.json({ success: true, data: classes });
    }
    catch (error) {
        console.error("Get Classes Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getClasses = getClasses;
