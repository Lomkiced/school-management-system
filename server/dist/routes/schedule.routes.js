"use strict";
// FILE: server/src/routes/schedule.routes.ts
// 2026 Standard: Timetable/Schedule routes with conflict detection
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
const ScheduleService = __importStar(require("../services/schedule.service"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ================= TIME SLOTS =================
/**
 * GET /api/schedule/time-slots
 * Get all time slots
 */
router.get('/time-slots', async (req, res) => {
    try {
        const slots = await ScheduleService.getTimeSlots();
        res.json({ success: true, data: slots });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /api/schedule/time-slots
 * Create a new time slot (Admin only)
 */
router.post('/time-slots', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const slot = await ScheduleService.createTimeSlot(req.body);
        res.status(201).json({ success: true, data: slot });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /api/schedule/time-slots/defaults
 * Create default time slots (Admin only)
 */
router.post('/time-slots/defaults', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const result = await ScheduleService.createDefaultTimeSlots();
        res.status(201).json({
            success: true,
            message: `Created ${result.created} time slots`,
            data: result.slots
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ================= SCHEDULE MANAGEMENT =================
/**
 * POST /api/schedule
 * Create a new schedule entry (Admin only)
 */
router.post('/', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { classId, teacherId, timeSlotId, dayOfWeek, room, academicYearId } = req.body;
        const result = await ScheduleService.createSchedule({ classId, teacherId, timeSlotId, dayOfWeek, room }, academicYearId);
        if (!result.success) {
            return res.status(409).json({
                success: false,
                message: result.message,
                conflicts: result.conflicts
            });
        }
        res.status(201).json({ success: true, data: result.data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * PUT /api/schedule/:id
 * Update a schedule entry (Admin only)
 */
router.put('/:id', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * DELETE /api/schedule/:id
 * Delete a schedule entry (Admin only)
 */
router.delete('/:id', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        await ScheduleService.deleteSchedule(req.params.id);
        res.json({ success: true, message: 'Schedule deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /api/schedule/check-conflicts
 * Check for conflicts without creating (Admin only)
 */
router.post('/check-conflicts', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { classId, teacherId, timeSlotId, dayOfWeek, room, academicYearId, excludeId } = req.body;
        const result = await ScheduleService.checkConflicts({ classId, teacherId, timeSlotId, dayOfWeek, room }, academicYearId, excludeId);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /api/schedule/bulk-import
 * Bulk import schedules (Admin only)
 */
router.post('/bulk-import', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { entries, academicYearId, skipConflicts } = req.body;
        const result = await ScheduleService.bulkImportSchedules(entries, academicYearId, skipConflicts);
        res.json({
            success: true,
            message: `Created ${result.created} schedules, skipped ${result.skipped}`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ================= TIMETABLE VIEWS =================
/**
 * GET /api/schedule/class/:classId
 * Get timetable for a class
 */
router.get('/class/:classId', async (req, res) => {
    try {
        const { academicYearId } = req.query;
        const timetable = await ScheduleService.getClassTimetable(req.params.classId, academicYearId);
        res.json({ success: true, data: timetable });
    }
    catch (error) {
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
        const timetable = await ScheduleService.getTeacherTimetable(req.params.teacherId, academicYearId);
        res.json({ success: true, data: timetable });
    }
    catch (error) {
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
        const availability = await ScheduleService.getRoomAvailability(req.params.room, dayOfWeek, academicYearId);
        res.json({ success: true, data: availability });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /api/schedule/workloads
 * Get teacher workload summary (Admin only)
 */
router.get('/workloads', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { academicYearId } = req.query;
        const workloads = await ScheduleService.getTeacherWorkloads(academicYearId);
        res.json({ success: true, data: workloads });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
