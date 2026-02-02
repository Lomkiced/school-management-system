// FILE: server/src/routes/attendance.routes.ts
// 2026 Standard: Attendance routes with QR code and automation

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import * as AttendanceService from '../services/attendance.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ================= QR CODE ROUTES =================

/**
 * POST /api/attendance/qr/generate
 * Generate daily QR codes for classes (Teacher/Admin)
 */
router.post(
    '/qr/generate',
    restrictTo('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const date = req.body.date ? new Date(req.body.date) : new Date();
            const qrCodes = await AttendanceService.generateDailyQRCodes(date);

            res.json({
                success: true,
                message: `Generated ${qrCodes.length} QR codes`,
                data: qrCodes
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * POST /api/attendance/qr/checkin
 * Student check-in via QR code scan
 */
router.post(
    '/qr/checkin',
    restrictTo('STUDENT'),
    async (req, res) => {
        try {
            const { qrToken, studentId } = req.body;

            const result = await AttendanceService.processQRCheckIn(studentId, qrToken);

            res.json({
                success: true,
                message: result.message || `Checked in as ${result.status}`,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

// ================= TEACHER ROUTES =================

/**
 * POST /api/attendance/record
 * Record attendance manually (Teacher)
 */
router.post(
    '/record',
    restrictTo('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { classId, date, records } = req.body;

            const result = await AttendanceService.recordManualAttendance({
                classId,
                date: new Date(date),
                records,
                teacherId: req.user!.id
            });

            res.json({
                success: true,
                message: `Recorded ${result.count} attendance entries`,
                data: result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * GET /api/attendance/class/:classId
 * Get class attendance for a date (Teacher)
 */
router.get(
    '/class/:classId',
    restrictTo('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const date = req.query.date
                ? new Date(req.query.date as string)
                : new Date();

            const result = await AttendanceService.getClassAttendance(
                req.params.classId,
                date
            );

            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * GET /api/attendance/class/:classId/report
 * Get attendance report for a period (Teacher)
 */
router.get(
    '/class/:classId/report',
    restrictTo('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate and endDate are required'
                });
            }

            const report = await AttendanceService.getAttendanceReport(
                req.params.classId,
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.json({ success: true, data: report });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * POST /api/attendance/class/:classId/mark-absent
 * Auto-mark absent students (Teacher/Admin)
 */
router.post(
    '/class/:classId/mark-absent',
    restrictTo('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const date = req.body.date ? new Date(req.body.date) : new Date();

            const result = await AttendanceService.markAbsentStudents(
                req.params.classId,
                date
            );

            res.json({
                success: true,
                message: `Marked ${result.marked} students absent`,
                data: result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ================= STUDENT ROUTES =================

/**
 * GET /api/attendance/student/:studentId
 * Get student's attendance history
 */
router.get('/student/:studentId', async (req, res) => {
    try {
        const { classId, startDate, endDate } = req.query;

        const result = await AttendanceService.getStudentAttendance(
            req.params.studentId,
            {
                classId: classId as string,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            }
        );

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
