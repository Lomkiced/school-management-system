"use strict";
// FILE: server/src/services/schedule.service.ts
// 2026 Standard: Timetable/Schedule management with conflict detection
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultTimeSlots = createDefaultTimeSlots;
exports.getTimeSlots = getTimeSlots;
exports.createTimeSlot = createTimeSlot;
exports.checkConflicts = checkConflicts;
exports.createSchedule = createSchedule;
exports.updateSchedule = updateSchedule;
exports.deleteSchedule = deleteSchedule;
exports.getClassTimetable = getClassTimetable;
exports.getTeacherTimetable = getTeacherTimetable;
exports.getRoomAvailability = getRoomAvailability;
exports.getTeacherWorkloads = getTeacherWorkloads;
exports.bulkImportSchedules = bulkImportSchedules;
const prisma_1 = __importDefault(require("../utils/prisma"));
// ================= TIME SLOT MANAGEMENT =================
/**
 * Create default time slots for a school
 */
async function createDefaultTimeSlots() {
    const defaultSlots = [
        { name: 'Period 1', startTime: '07:30', endTime: '08:30', order: 1 },
        { name: 'Period 2', startTime: '08:30', endTime: '09:30', order: 2 },
        { name: 'Period 3', startTime: '09:30', endTime: '10:30', order: 3 },
        { name: 'Recess', startTime: '10:30', endTime: '11:00', order: 4 },
        { name: 'Period 4', startTime: '11:00', endTime: '12:00', order: 5 },
        { name: 'Period 5', startTime: '12:00', endTime: '13:00', order: 6 },
        { name: 'Lunch', startTime: '13:00', endTime: '14:00', order: 7 },
        { name: 'Period 6', startTime: '14:00', endTime: '15:00', order: 8 },
        { name: 'Period 7', startTime: '15:00', endTime: '16:00', order: 9 },
    ];
    const created = await prisma_1.default.timeSlot.createMany({
        data: defaultSlots,
        skipDuplicates: true
    });
    return { created: created.count, slots: defaultSlots };
}
/**
 * Get all time slots
 */
async function getTimeSlots() {
    return await prisma_1.default.timeSlot.findMany({
        orderBy: { order: 'asc' }
    });
}
/**
 * Create a custom time slot
 */
async function createTimeSlot(data) {
    return await prisma_1.default.timeSlot.create({ data });
}
// ================= CONFLICT DETECTION =================
/**
 * Check for scheduling conflicts before adding a new entry
 */
async function checkConflicts(entry, academicYearId, excludeScheduleId) {
    const conflicts = [];
    const whereBase = {
        timeSlotId: entry.timeSlotId,
        dayOfWeek: entry.dayOfWeek,
        academicYearId,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } })
    };
    // 1. Check teacher conflict
    const teacherConflict = await prisma_1.default.schedule.findFirst({
        where: { ...whereBase, teacherId: entry.teacherId },
        include: {
            class: { select: { name: true } },
            timeSlot: { select: { name: true, startTime: true, endTime: true } }
        }
    });
    if (teacherConflict) {
        conflicts.push({
            type: 'TEACHER',
            message: `Teacher is already scheduled for ${teacherConflict.class.name} at ${teacherConflict.timeSlot.name} (${teacherConflict.timeSlot.startTime}-${teacherConflict.timeSlot.endTime})`,
            existingSchedule: teacherConflict
        });
    }
    // 2. Check class conflict
    const classConflict = await prisma_1.default.schedule.findFirst({
        where: { ...whereBase, classId: entry.classId },
        include: {
            teacher: { select: { firstName: true, lastName: true } },
            timeSlot: { select: { name: true, startTime: true, endTime: true } }
        }
    });
    if (classConflict) {
        conflicts.push({
            type: 'CLASS',
            message: `Class already has a schedule with ${classConflict.teacher.firstName} ${classConflict.teacher.lastName} at ${classConflict.timeSlot.name}`,
            existingSchedule: classConflict
        });
    }
    // 3. Check room conflict (if room is specified)
    if (entry.room) {
        const roomConflict = await prisma_1.default.schedule.findFirst({
            where: { ...whereBase, room: entry.room },
            include: {
                class: { select: { name: true } },
                teacher: { select: { firstName: true, lastName: true } },
                timeSlot: { select: { name: true } }
            }
        });
        if (roomConflict) {
            conflicts.push({
                type: 'ROOM',
                message: `Room "${entry.room}" is already booked for ${roomConflict.class.name} with ${roomConflict.teacher.firstName} ${roomConflict.teacher.lastName}`,
                existingSchedule: roomConflict
            });
        }
    }
    return {
        hasConflict: conflicts.length > 0,
        conflicts
    };
}
// ================= SCHEDULE CRUD =================
/**
 * Create a new schedule entry with conflict checking
 */
async function createSchedule(entry, academicYearId) {
    // Check for conflicts first
    const conflictCheck = await checkConflicts(entry, academicYearId);
    if (conflictCheck.hasConflict) {
        return {
            success: false,
            conflicts: conflictCheck.conflicts,
            message: 'Schedule conflicts detected'
        };
    }
    // Create the schedule
    const schedule = await prisma_1.default.schedule.create({
        data: {
            classId: entry.classId,
            teacherId: entry.teacherId,
            timeSlotId: entry.timeSlotId,
            dayOfWeek: entry.dayOfWeek,
            room: entry.room,
            academicYearId
        },
        include: {
            class: { select: { name: true, subject: { select: { name: true, code: true } } } },
            teacher: { select: { firstName: true, lastName: true } },
            timeSlot: true
        }
    });
    return { success: true, data: schedule };
}
/**
 * Update a schedule entry
 */
async function updateSchedule(scheduleId, updates) {
    // Get current schedule
    const current = await prisma_1.default.schedule.findUnique({
        where: { id: scheduleId }
    });
    if (!current) {
        throw new Error('Schedule not found');
    }
    // Build merged entry for conflict check
    const mergedEntry = {
        classId: updates.classId || current.classId,
        teacherId: updates.teacherId || current.teacherId,
        timeSlotId: updates.timeSlotId || current.timeSlotId,
        dayOfWeek: updates.dayOfWeek || current.dayOfWeek,
        room: updates.room !== undefined ? updates.room : current.room || undefined
    };
    // Check conflicts (excluding current schedule)
    const conflictCheck = await checkConflicts(mergedEntry, current.academicYearId, scheduleId);
    if (conflictCheck.hasConflict) {
        return {
            success: false,
            conflicts: conflictCheck.conflicts,
            message: 'Schedule conflicts detected'
        };
    }
    // Update
    const schedule = await prisma_1.default.schedule.update({
        where: { id: scheduleId },
        data: updates,
        include: {
            class: { select: { name: true } },
            teacher: { select: { firstName: true, lastName: true } },
            timeSlot: true
        }
    });
    return { success: true, data: schedule };
}
/**
 * Delete a schedule entry
 */
async function deleteSchedule(scheduleId) {
    return await prisma_1.default.schedule.delete({
        where: { id: scheduleId }
    });
}
// ================= SCHEDULE QUERIES =================
/**
 * Get full timetable for a class
 */
async function getClassTimetable(classId, academicYearId) {
    const yearId = academicYearId || await getCurrentAcademicYearId();
    const schedules = await prisma_1.default.schedule.findMany({
        where: { classId, academicYearId: yearId },
        include: {
            teacher: { select: { firstName: true, lastName: true } },
            timeSlot: true,
            class: { select: { name: true, subject: { select: { name: true, code: true } } } }
        },
        orderBy: [
            { dayOfWeek: 'asc' },
            { timeSlot: { order: 'asc' } }
        ]
    });
    // Organize by day
    const timetable = organizeTimetableByDay(schedules);
    return { classId, academicYearId: yearId, timetable, raw: schedules };
}
/**
 * Get full timetable for a teacher
 */
async function getTeacherTimetable(teacherId, academicYearId) {
    const yearId = academicYearId || await getCurrentAcademicYearId();
    const schedules = await prisma_1.default.schedule.findMany({
        where: { teacherId, academicYearId: yearId },
        include: {
            class: { select: { name: true, subject: { select: { name: true, code: true } } } },
            timeSlot: true
        },
        orderBy: [
            { dayOfWeek: 'asc' },
            { timeSlot: { order: 'asc' } }
        ]
    });
    // Calculate weekly hours
    const weeklyHours = schedules.length; // Each period = 1 hour typically
    // Get teacher's max hours
    const teacher = await prisma_1.default.teacher.findUnique({
        where: { id: teacherId },
        select: { maxWeeklyHours: true, firstName: true, lastName: true }
    });
    const timetable = organizeTimetableByDay(schedules);
    return {
        teacherId,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown',
        academicYearId: yearId,
        weeklyHours,
        maxWeeklyHours: teacher?.maxWeeklyHours || 40,
        utilizationPercent: teacher ? Math.round((weeklyHours / teacher.maxWeeklyHours) * 100) : 0,
        timetable,
        raw: schedules
    };
}
/**
 * Get room availability for a specific day
 */
async function getRoomAvailability(room, dayOfWeek, academicYearId) {
    const yearId = academicYearId || await getCurrentAcademicYearId();
    const bookedSlots = await prisma_1.default.schedule.findMany({
        where: { room, dayOfWeek, academicYearId: yearId },
        include: {
            timeSlot: true,
            class: { select: { name: true } }
        }
    });
    const allSlots = await prisma_1.default.timeSlot.findMany({
        orderBy: { order: 'asc' }
    });
    const bookedSlotIds = new Set(bookedSlots.map(s => s.timeSlotId));
    return {
        room,
        dayOfWeek,
        slots: allSlots.map(slot => ({
            ...slot,
            isAvailable: !bookedSlotIds.has(slot.id),
            booking: bookedSlots.find(b => b.timeSlotId === slot.id) || null
        }))
    };
}
/**
 * Get teacher workload summary
 */
async function getTeacherWorkloads(academicYearId) {
    const yearId = academicYearId || await getCurrentAcademicYearId();
    const teachers = await prisma_1.default.teacher.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            maxWeeklyHours: true,
            _count: {
                select: {
                    schedules: {
                        where: { academicYearId: yearId }
                    }
                }
            }
        }
    });
    return teachers.map(t => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        currentHours: t._count.schedules,
        maxHours: t.maxWeeklyHours,
        utilizationPercent: Math.round((t._count.schedules / t.maxWeeklyHours) * 100),
        status: t._count.schedules >= t.maxWeeklyHours ? 'FULL' :
            t._count.schedules >= t.maxWeeklyHours * 0.8 ? 'HIGH' :
                t._count.schedules >= t.maxWeeklyHours * 0.5 ? 'MODERATE' : 'LOW'
    }));
}
// ================= HELPER FUNCTIONS =================
async function getCurrentAcademicYearId() {
    const current = await prisma_1.default.academicYear.findFirst({
        where: { isCurrent: true }
    });
    if (!current)
        throw new Error('No current academic year set');
    return current.id;
}
function organizeTimetableByDay(schedules) {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days.reduce((acc, day) => {
        acc[day] = schedules.filter(s => s.dayOfWeek === day);
        return acc;
    }, {});
}
/**
 * Bulk import schedules from timetable grid
 */
async function bulkImportSchedules(entries, academicYearId, skipConflicts = false) {
    const results = {
        created: 0,
        skipped: 0,
        conflicts: []
    };
    for (const entry of entries) {
        const conflictCheck = await checkConflicts(entry, academicYearId);
        if (conflictCheck.hasConflict) {
            if (skipConflicts) {
                results.skipped++;
                results.conflicts.push({ entry, conflicts: conflictCheck.conflicts });
                continue;
            }
            else {
                throw new Error(`Conflict detected: ${conflictCheck.conflicts[0].message}`);
            }
        }
        await prisma_1.default.schedule.create({
            data: { ...entry, academicYearId }
        });
        results.created++;
    }
    return results;
}
