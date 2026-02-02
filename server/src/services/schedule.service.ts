// FILE: server/src/services/schedule.service.ts
// 2026 Standard: Timetable/Schedule management with conflict detection

import { DayOfWeek, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

// ================= TYPE DEFINITIONS =================

interface ScheduleEntry {
    classId: string;
    teacherId: string;
    timeSlotId: string;
    dayOfWeek: DayOfWeek;
    room?: string;
}

interface ConflictResult {
    hasConflict: boolean;
    conflicts: {
        type: 'TEACHER' | 'CLASS' | 'ROOM';
        message: string;
        existingSchedule?: any;
    }[];
}

// ================= TIME SLOT MANAGEMENT =================

/**
 * Create default time slots for a school
 */
export async function createDefaultTimeSlots() {
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

    const created = await prisma.timeSlot.createMany({
        data: defaultSlots,
        skipDuplicates: true
    });

    return { created: created.count, slots: defaultSlots };
}

/**
 * Get all time slots
 */
export async function getTimeSlots() {
    return await prisma.timeSlot.findMany({
        orderBy: { order: 'asc' }
    });
}

/**
 * Create a custom time slot
 */
export async function createTimeSlot(data: {
    name: string;
    startTime: string;
    endTime: string;
    order: number;
}) {
    return await prisma.timeSlot.create({ data });
}

// ================= CONFLICT DETECTION =================

/**
 * Check for scheduling conflicts before adding a new entry
 */
export async function checkConflicts(
    entry: ScheduleEntry,
    academicYearId: string,
    excludeScheduleId?: string
): Promise<ConflictResult> {
    const conflicts: ConflictResult['conflicts'] = [];

    const whereBase: Prisma.ScheduleWhereInput = {
        timeSlotId: entry.timeSlotId,
        dayOfWeek: entry.dayOfWeek,
        academicYearId,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } })
    };

    // 1. Check teacher conflict
    const teacherConflict = await prisma.schedule.findFirst({
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
    const classConflict = await prisma.schedule.findFirst({
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
        const roomConflict = await prisma.schedule.findFirst({
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
export async function createSchedule(
    entry: ScheduleEntry,
    academicYearId: string
) {
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
    const schedule = await prisma.schedule.create({
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
export async function updateSchedule(
    scheduleId: string,
    updates: Partial<ScheduleEntry>
) {
    // Get current schedule
    const current = await prisma.schedule.findUnique({
        where: { id: scheduleId }
    });

    if (!current) {
        throw new Error('Schedule not found');
    }

    // Build merged entry for conflict check
    const mergedEntry: ScheduleEntry = {
        classId: updates.classId || current.classId,
        teacherId: updates.teacherId || current.teacherId,
        timeSlotId: updates.timeSlotId || current.timeSlotId,
        dayOfWeek: updates.dayOfWeek || current.dayOfWeek,
        room: updates.room !== undefined ? updates.room : current.room || undefined
    };

    // Check conflicts (excluding current schedule)
    const conflictCheck = await checkConflicts(
        mergedEntry,
        current.academicYearId,
        scheduleId
    );

    if (conflictCheck.hasConflict) {
        return {
            success: false,
            conflicts: conflictCheck.conflicts,
            message: 'Schedule conflicts detected'
        };
    }

    // Update
    const schedule = await prisma.schedule.update({
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
export async function deleteSchedule(scheduleId: string) {
    return await prisma.schedule.delete({
        where: { id: scheduleId }
    });
}

// ================= SCHEDULE QUERIES =================

/**
 * Get full timetable for a class
 */
export async function getClassTimetable(classId: string, academicYearId?: string) {
    const yearId = academicYearId || await getCurrentAcademicYearId();

    const schedules = await prisma.schedule.findMany({
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
export async function getTeacherTimetable(teacherId: string, academicYearId?: string) {
    const yearId = academicYearId || await getCurrentAcademicYearId();

    const schedules = await prisma.schedule.findMany({
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
    const teacher = await prisma.teacher.findUnique({
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
export async function getRoomAvailability(
    room: string,
    dayOfWeek: DayOfWeek,
    academicYearId?: string
) {
    const yearId = academicYearId || await getCurrentAcademicYearId();

    const bookedSlots = await prisma.schedule.findMany({
        where: { room, dayOfWeek, academicYearId: yearId },
        include: {
            timeSlot: true,
            class: { select: { name: true } }
        }
    });

    const allSlots = await prisma.timeSlot.findMany({
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
export async function getTeacherWorkloads(academicYearId?: string) {
    const yearId = academicYearId || await getCurrentAcademicYearId();

    const teachers = await prisma.teacher.findMany({
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

async function getCurrentAcademicYearId(): Promise<string> {
    const current = await prisma.academicYear.findFirst({
        where: { isCurrent: true }
    });
    if (!current) throw new Error('No current academic year set');
    return current.id;
}

function organizeTimetableByDay(schedules: any[]) {
    const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    return days.reduce((acc, day) => {
        acc[day] = schedules.filter(s => s.dayOfWeek === day);
        return acc;
    }, {} as Record<DayOfWeek, any[]>);
}

/**
 * Bulk import schedules from timetable grid
 */
export async function bulkImportSchedules(
    entries: ScheduleEntry[],
    academicYearId: string,
    skipConflicts: boolean = false
) {
    const results = {
        created: 0,
        skipped: 0,
        conflicts: [] as any[]
    };

    for (const entry of entries) {
        const conflictCheck = await checkConflicts(entry, academicYearId);

        if (conflictCheck.hasConflict) {
            if (skipConflicts) {
                results.skipped++;
                results.conflicts.push({ entry, conflicts: conflictCheck.conflicts });
                continue;
            } else {
                throw new Error(`Conflict detected: ${conflictCheck.conflicts[0].message}`);
            }
        }

        await prisma.schedule.create({
            data: { ...entry, academicYearId }
        });
        results.created++;
    }

    return results;
}
