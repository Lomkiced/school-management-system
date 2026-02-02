// FILE: server/src/routes/schedule.routes.ts
// 2026 Standard: Timetable/Schedule routes with conflict detection

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import * as ScheduleService from '../services/schedule.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ================= TIME SLOTS =================

/**
 * GET /api/schedule/time-slots
 * Get all time slots
 */
router.get('/time-slots', async (req, res) => {
    try {
        const slots = await ScheduleService.getTimeSlots();
        res.json({ success: true, data: slots });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/schedule/time-slots
 * Create a new time slot (Admin only)
 */
router.post(
    '/time-slots',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const slot = await ScheduleService.createTimeSlot(req.body);
            res.status(201).json({ success: true, data: slot });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * POST /api/schedule/time-slots/defaults
 * Create default time slots (Admin only)
 */
router.post(
    '/time-slots/defaults',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const result = await ScheduleService.createDefaultTimeSlots();
            res.status(201).json({
                success: true,
                message: `Created ${result.created} time slots`,
                data: result.slots
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ================= SCHEDULE MANAGEMENT =================

/**
 * POST /api/schedule
 * Create a new schedule entry (Admin only)
 */
router.post(
    '/',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { classId, teacherId, timeSlotId, dayOfWeek, room, academicYearId } = req.body;

            const result = await ScheduleService.createSchedule(
                { classId, teacherId, timeSlotId, dayOfWeek, room },
                academicYearId
            );

            if (!result.success) {
                return res.status(409).json({
                    success: false,
                    message: result.message,
                    conflicts: result.conflicts
                });
            }

            res.status(201).json({ success: true, data: result.data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * PUT /api/schedule/:id
 * Update a schedule entry (Admin only)
 */
router.put(
    '/:id',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const result = await ScheduleService.updateSchedule(req.params.id, req.body);

            if (!result.success) {
                return res.status(409).json({
                    success: false,
                    message: result.message,
                    conflicts: result.conflicts
                });
            }

            res.json({ success: true, data: result.data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * DELETE /api/schedule/:id
 * Delete a schedule entry (Admin only)
 */
router.delete(
    '/:id',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            await ScheduleService.deleteSchedule(req.params.id);
            res.json({ success: true, message: 'Schedule deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * POST /api/schedule/check-conflicts
 * Check for conflicts without creating (Admin only)
 */
router.post(
    '/check-conflicts',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { classId, teacherId, timeSlotId, dayOfWeek, room, academicYearId, excludeId } = req.body;

            const result = await ScheduleService.checkConflicts(
                { classId, teacherId, timeSlotId, dayOfWeek, room },
                academicYearId,
                excludeId
            );

            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * POST /api/schedule/bulk-import
 * Bulk import schedules (Admin only)
 */
router.post(
    '/bulk-import',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { entries, academicYearId, skipConflicts } = req.body;

            const result = await ScheduleService.bulkImportSchedules(
                entries,
                academicYearId,
                skipConflicts
            );

            res.json({
                success: true,
                message: `Created ${result.created} schedules, skipped ${result.skipped}`,
                data: result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ================= TIMETABLE VIEWS =================

/**
 * GET /api/schedule/class/:classId
 * Get timetable for a class
 */
router.get('/class/:classId', async (req, res) => {
    try {
        const { academicYearId } = req.query;
        const timetable = await ScheduleService.getClassTimetable(
            req.params.classId,
            academicYearId as string
        );
        res.json({ success: true, data: timetable });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/schedule/teacher/:teacherId
 * Get timetable for a teacher
 */
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const { academicYearId } = req.query;
        const timetable = await ScheduleService.getTeacherTimetable(
            req.params.teacherId,
            academicYearId as string
        );
        res.json({ success: true, data: timetable });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/schedule/room/:room/availability
 * Get room availability for a day
 */
router.get('/room/:room/availability', async (req, res) => {
    try {
        const { dayOfWeek, academicYearId } = req.query;

        if (!dayOfWeek) {
            return res.status(400).json({
                success: false,
                message: 'dayOfWeek query parameter is required'
            });
        }

        const availability = await ScheduleService.getRoomAvailability(
            req.params.room,
            dayOfWeek as any,
            academicYearId as string
        );

        res.json({ success: true, data: availability });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/schedule/workloads
 * Get teacher workload summary (Admin only)
 */
router.get(
    '/workloads',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { academicYearId } = req.query;
            const workloads = await ScheduleService.getTeacherWorkloads(academicYearId as string);
            res.json({ success: true, data: workloads });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

export default router;
