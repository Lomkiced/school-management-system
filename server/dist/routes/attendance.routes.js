"use strict";
// FILE: server/src/routes/attendance.routes.ts
// 2026 Standard: Attendance routes with QR code and automation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const AttendanceService = __importStar(require("../services/attendance.service"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ================= QR CODE ROUTES =================
/**
 * POST /api/attendance/qr/generate
 * Generate daily QR codes for classes (Teacher/Admin)
 */
router.post('/qr/generate', (0, role_middleware_1.restrictTo)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const date = req.body.date ? new Date(req.body.date) : new Date();
        const qrCodes = await AttendanceService.generateDailyQRCodes(date);
        res.json({
            success: true,
            message: `Generated ${qrCodes.length} QR codes`,
            data: qrCodes
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /api/attendance/qr/checkin
 * Student check-in via QR code scan
 */
router.post('/qr/checkin', (0, role_middleware_1.restrictTo)('STUDENT'), async (req, res) => {
    try {
        const { qrToken, studentId } = req.body;
        const result = await AttendanceService.processQRCheckIn(studentId, qrToken);
        res.json({
            success: true,
            message: result.message || `Checked in as ${result.status}`,
            data: result
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// ================= TEACHER ROUTES =================
/**
 * POST /api/attendance/record
 * Record attendance manually (Teacher)
 */
router.post('/record', (0, role_middleware_1.restrictTo)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { classId, date, records } = req.body;
        const result = await AttendanceService.recordManualAttendance({
            classId,
            date: new Date(date),
            records,
            teacherId: req.user.id
        });
        res.json({
            success: true,
            message: `Recorded ${result.count} attendance entries`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /api/attendance/class/:classId
 * Get class attendance for a date (Teacher)
 */
router.get('/class/:classId', (0, role_middleware_1.restrictTo)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const date = req.query.date
            ? new Date(req.query.date)
            : new Date();
        const result = await AttendanceService.getClassAttendance(req.params.classId, date);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /api/attendance/class/:classId/report
 * Get attendance report for a period (Teacher)
 */
router.get('/class/:classId/report', (0, role_middleware_1.restrictTo)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            });
        }
        const report = await AttendanceService.getAttendanceReport(req.params.classId, new Date(startDate), new Date(endDate));
        res.json({ success: true, data: report });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /api/attendance/class/:classId/mark-absent
 * Auto-mark absent students (Teacher/Admin)
 */
router.post('/class/:classId/mark-absent', (0, role_middleware_1.restrictTo)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const date = req.body.date ? new Date(req.body.date) : new Date();
        const result = await AttendanceService.markAbsentStudents(req.params.classId, date);
        res.json({
            success: true,
            message: `Marked ${result.marked} students absent`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ================= STUDENT ROUTES =================
/**
 * GET /api/attendance/student/:studentId
 * Get student's attendance history
 */
router.get('/student/:studentId', async (req, res) => {
    try {
        const { classId, startDate, endDate } = req.query;
        const result = await AttendanceService.getStudentAttendance(req.params.studentId, {
            classId: classId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
