"use strict";
// FILE: server/src/services/attendance.service.ts
// 2026 Standard: Attendance automation with QR code check-in and parent notifications
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRToken = generateQRToken;
exports.decodeQRToken = decodeQRToken;
exports.generateDailyQRCodes = generateDailyQRCodes;
exports.processQRCheckIn = processQRCheckIn;
exports.recordManualAttendance = recordManualAttendance;
exports.getClassAttendance = getClassAttendance;
exports.getStudentAttendance = getStudentAttendance;
exports.getAttendanceReport = getAttendanceReport;
exports.markAbsentStudents = markAbsentStudents;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const notification_service_1 = require("./notification.service");
// ================= QR CODE GENERATION =================
/**
 * Generate a unique QR token for student check-in
 * Token format: base64(classId:date:random)
 */
function generateQRToken(classId, date) {
    const dateStr = date.toISOString().split('T')[0];
    const random = crypto_1.default.randomBytes(8).toString('hex');
    const payload = `${classId}:${dateStr}:${random}`;
    return Buffer.from(payload).toString('base64url');
}
/**
 * Decode QR token to extract class and date
 */
function decodeQRToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64url').toString();
        const [classId, date] = decoded.split(':');
        return { classId, date };
    }
    catch {
        return null;
    }
}
/**
 * Generate daily attendance QR codes for all classes
 * Called by CRON job at start of school day
 */
async function generateDailyQRCodes(date = new Date()) {
    const classes = await prisma_1.default.class.findMany({
        where: { teacherId: { not: null } },
        select: { id: true, name: true }
    });
    const qrCodes = [];
    for (const cls of classes) {
        const token = generateQRToken(cls.id, date);
        qrCodes.push({
            classId: cls.id,
            className: cls.name,
            qrToken: token
        });
    }
    console.log(`📱 Generated ${qrCodes.length} daily QR codes`);
    return qrCodes;
}
// ================= CHECK-IN PROCESSING =================
/**
 * Process student check-in via QR code scan
 */
async function processQRCheckIn(studentId, qrToken) {
    const tokenData = decodeQRToken(qrToken);
    if (!tokenData) {
        throw new Error('Invalid QR code');
    }
    const { classId, date: dateStr } = tokenData;
    const today = new Date().toISOString().split('T')[0];
    // Validate date
    if (dateStr !== today) {
        throw new Error('QR code has expired. Please use today\'s code.');
    }
    // Verify student is enrolled
    const enrollment = await prisma_1.default.enrollment.findFirst({
        where: { studentId, classId }
    });
    if (!enrollment) {
        throw new Error('Student is not enrolled in this class');
    }
    // Check if already checked in
    const existing = await prisma_1.default.attendance.findFirst({
        where: {
            studentId,
            classId,
            date: new Date(dateStr)
        }
    });
    if (existing) {
        return { success: true, message: 'Already checked in', attendance: existing };
    }
    // Determine status based on time (example: school starts at 8:00 AM)
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 8 || (hour === 8 && minute > 15);
    const attendance = await prisma_1.default.attendance.create({
        data: {
            studentId,
            classId,
            date: new Date(dateStr),
            status: isLate ? 'LATE' : 'PRESENT',
            checkInTime: now,
            checkInMethod: 'QR_CODE',
            qrToken
        },
        include: {
            class: { select: { name: true } },
            student: { select: { firstName: true, lastName: true } }
        }
    });
    // Notify parent if late
    if (isLate) {
        await (0, notification_service_1.notifyParentAboutAttendance)(studentId, 'LATE', attendance.class.name, new Date(dateStr));
    }
    console.log(`✅ Check-in: ${attendance.student.firstName} ${attendance.student.lastName} - ${isLate ? 'LATE' : 'PRESENT'}`);
    return {
        success: true,
        status: isLate ? 'LATE' : 'PRESENT',
        attendance
    };
}
/**
 * Manual attendance marking by teacher
 */
async function recordManualAttendance(data) {
    const results = [];
    const absentStudentIds = [];
    for (const record of data.records) {
        const attendance = await prisma_1.default.attendance.upsert({
            where: {
                studentId_classId_date: {
                    studentId: record.studentId,
                    classId: data.classId,
                    date: data.date
                }
            },
            update: {
                status: record.status,
                remarks: record.remarks,
                checkInMethod: 'MANUAL'
            },
            create: {
                studentId: record.studentId,
                classId: data.classId,
                date: data.date,
                status: record.status,
                remarks: record.remarks,
                checkInMethod: 'MANUAL'
            }
        });
        results.push(attendance);
        // Track absences for parent notification
        if (record.status === 'ABSENT') {
            absentStudentIds.push(record.studentId);
        }
    }
    // Notify parents of absent students
    if (absentStudentIds.length > 0) {
        await notifyParentsOfAbsences(absentStudentIds, data.classId, data.date);
    }
    return { count: results.length, results };
}
/**
 * Notify parents of absent students
 */
async function notifyParentsOfAbsences(studentIds, classId, date) {
    const classInfo = await prisma_1.default.class.findUnique({
        where: { id: classId },
        select: { name: true }
    });
    for (const studentId of studentIds) {
        const student = await prisma_1.default.student.findUnique({
            where: { id: studentId },
            include: { parent: { include: { user: true } } }
        });
        if (student?.parent) {
            await (0, notification_service_1.notifyParentAboutAttendance)(studentId, 'ABSENT', classInfo?.name || 'Unknown Class', date);
            // Mark as notified
            await prisma_1.default.attendance.updateMany({
                where: { studentId, classId, date },
                data: { parentNotified: true, notifiedAt: new Date() }
            });
        }
    }
}
// ================= ATTENDANCE QUERIES =================
/**
 * Get class attendance for a specific date
 */
async function getClassAttendance(classId, date) {
    // Get all enrolled students
    const enrollments = await prisma_1.default.enrollment.findMany({
        where: { classId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    user: { select: { email: true } }
                }
            }
        }
    });
    // Get attendance records for this date
    const attendanceRecords = await prisma_1.default.attendance.findMany({
        where: { classId, date }
    });
    const attendanceMap = new Map(attendanceRecords.map(a => [a.studentId, a]));
    // Build attendance sheet
    const sheet = enrollments.map(e => ({
        student: e.student,
        attendance: attendanceMap.get(e.student.id) || null,
        status: attendanceMap.get(e.student.id)?.status || 'UNMARKED'
    }));
    // Calculate stats
    const stats = {
        total: sheet.length,
        present: sheet.filter(s => s.status === 'PRESENT').length,
        absent: sheet.filter(s => s.status === 'ABSENT').length,
        late: sheet.filter(s => s.status === 'LATE').length,
        excused: sheet.filter(s => s.status === 'EXCUSED').length,
        unmarked: sheet.filter(s => s.status === 'UNMARKED').length
    };
    return { date, classId, sheet, stats };
}
/**
 * Get student's attendance history
 */
async function getStudentAttendance(studentId, options) {
    const where = { studentId };
    if (options?.classId)
        where.classId = options.classId;
    if (options?.startDate || options?.endDate) {
        where.date = {};
        if (options.startDate)
            where.date.gte = options.startDate;
        if (options.endDate)
            where.date.lte = options.endDate;
    }
    const records = await prisma_1.default.attendance.findMany({
        where,
        include: {
            class: { select: { name: true, subject: { select: { name: true } } } }
        },
        orderBy: { date: 'desc' }
    });
    // Calculate summary
    const summary = {
        total: records.length,
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        late: records.filter(r => r.status === 'LATE').length,
        excused: records.filter(r => r.status === 'EXCUSED').length,
        attendanceRate: 0
    };
    if (summary.total > 0) {
        summary.attendanceRate = Math.round(((summary.present + summary.late + summary.excused) / summary.total) * 100);
    }
    return { records, summary };
}
/**
 * Get attendance report for a class over a period
 */
async function getAttendanceReport(classId, startDate, endDate) {
    const records = await prisma_1.default.attendance.findMany({
        where: {
            classId,
            date: { gte: startDate, lte: endDate }
        },
        include: {
            student: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: [{ date: 'asc' }, { student: { lastName: 'asc' } }]
    });
    // Group by student
    const byStudent = records.reduce((acc, r) => {
        const key = r.studentId;
        if (!acc[key]) {
            acc[key] = {
                student: r.student,
                records: [],
                stats: { present: 0, absent: 0, late: 0, excused: 0 }
            };
        }
        acc[key].records.push(r);
        acc[key].stats[r.status.toLowerCase()]++;
        return acc;
    }, {});
    return {
        period: { startDate, endDate },
        classId,
        students: Object.values(byStudent)
    };
}
// ================= ATTENDANCE AUTOMATION =================
/**
 * Auto-mark absent students who didn't check in by end of class
 * Called by CRON job at end of each period
 */
async function markAbsentStudents(classId, date = new Date()) {
    // Get enrolled students
    const enrollments = await prisma_1.default.enrollment.findMany({
        where: { classId },
        select: { studentId: true }
    });
    // Get students who already have attendance
    const checked = await prisma_1.default.attendance.findMany({
        where: { classId, date },
        select: { studentId: true }
    });
    const checkedIds = new Set(checked.map(c => c.studentId));
    // Find students without attendance
    const absentIds = enrollments
        .filter(e => !checkedIds.has(e.studentId))
        .map(e => e.studentId);
    if (absentIds.length === 0)
        return { marked: 0 };
    // Mark as absent
    await prisma_1.default.attendance.createMany({
        data: absentIds.map(studentId => ({
            studentId,
            classId,
            date,
            status: 'ABSENT',
            checkInMethod: 'MANUAL',
            remarks: 'Auto-marked absent'
        })),
        skipDuplicates: true
    });
    // Notify parents
    await notifyParentsOfAbsences(absentIds, classId, date);
    console.log(`⚠️ Auto-marked ${absentIds.length} students absent in class ${classId}`);
    return { marked: absentIds.length };
}
