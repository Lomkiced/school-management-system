"use strict";
// FILE: server/src/services/notification.service.ts
// 2026 Standard: Unified notification system for all automation events
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createBulkNotifications = createBulkNotifications;
exports.getUserNotifications = getUserNotifications;
exports.getUnreadCount = getUnreadCount;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.deleteNotification = deleteNotification;
exports.cleanupOldNotifications = cleanupOldNotifications;
exports.notifyParentAboutAttendance = notifyParentAboutAttendance;
exports.notifyStudentAboutGrade = notifyStudentAboutGrade;
exports.notifyAssignmentDue = notifyAssignmentDue;
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Create a notification and push via Socket.IO for real-time updates
 */
async function createNotification(data) {
    const notification = await prisma_1.default.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            channel: data.channel || 'IN_APP',
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata,
            status: 'PENDING'
        }
    });
    // Push real-time notification via Socket.IO
    try {
        const io = (0, socket_1.getIO)();
        io.to(`user:${data.userId}`).emit('notification:new', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            createdAt: notification.createdAt
        });
        // Mark as sent
        await prisma_1.default.notification.update({
            where: { id: notification.id },
            data: { status: 'SENT', sentAt: new Date() }
        });
    }
    catch (error) {
        console.error('Socket notification failed:', error);
    }
    return notification;
}
/**
 * Create bulk notifications (e.g., for all parents of a class)
 */
async function createBulkNotifications(userIds, data) {
    const notifications = await prisma_1.default.notification.createMany({
        data: userIds.map(userId => ({
            userId,
            type: data.type,
            channel: data.channel || 'IN_APP',
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata,
            status: 'PENDING'
        }))
    });
    // Push real-time notifications
    try {
        const io = (0, socket_1.getIO)();
        for (const userId of userIds) {
            io.to(`user:${userId}`).emit('notification:new', {
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                createdAt: new Date()
            });
        }
    }
    catch (error) {
        console.error('Bulk socket notification failed:', error);
    }
    return notifications;
}
// ================= NOTIFICATION QUERIES =================
/**
 * Get user's notifications with pagination
 */
async function getUserNotifications(userId, query) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where = { userId };
    if (query.unreadOnly)
        where.isRead = false;
    if (query.type)
        where.type = query.type;
    const [total, notifications, unreadCount] = await prisma_1.default.$transaction([
        prisma_1.default.notification.count({ where }),
        prisma_1.default.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.default.notification.count({
            where: { userId, isRead: false }
        })
    ]);
    return {
        data: notifications,
        unreadCount,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
}
/**
 * Get unread notification count for navbar badge
 */
async function getUnreadCount(userId) {
    return await prisma_1.default.notification.count({
        where: { userId, isRead: false }
    });
}
// ================= NOTIFICATION ACTIONS =================
/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
    return await prisma_1.default.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date(), status: 'READ' }
    });
}
/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
    return await prisma_1.default.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date(), status: 'READ' }
    });
}
/**
 * Delete a notification
 */
async function deleteNotification(notificationId, userId) {
    return await prisma_1.default.notification.deleteMany({
        where: { id: notificationId, userId }
    });
}
/**
 * Delete all read notifications older than X days
 */
async function cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma_1.default.notification.deleteMany({
        where: {
            isRead: true,
            createdAt: { lt: cutoffDate }
        }
    });
    console.log(`🧹 Cleaned up ${result.count} old notifications`);
    return result;
}
// ================= NOTIFICATION HELPERS =================
/**
 * Helper: Notify parent about student's attendance
 */
async function notifyParentAboutAttendance(studentId, status, className, date) {
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        include: { parent: { include: { user: true } } }
    });
    if (!student?.parent)
        return null;
    const type = status === 'ABSENT' ? 'ATTENDANCE_ABSENT' : 'ATTENDANCE_LATE';
    const statusText = status === 'ABSENT' ? 'marked absent' : 'arrived late';
    return await createNotification({
        userId: student.parent.userId,
        type: type,
        title: `Attendance Alert: ${student.firstName}`,
        message: `${student.firstName} was ${statusText} in ${className} on ${date.toLocaleDateString()}.`,
        link: `/parent/children/${studentId}/attendance`,
        metadata: { studentId, className, date: date.toISOString(), status }
    });
}
/**
 * Helper: Notify student about new grade
 */
async function notifyStudentAboutGrade(studentId, userId, className, score, gradeType) {
    return await createNotification({
        userId,
        type: 'GRADE_POSTED',
        title: 'New Grade Posted',
        message: `You received ${score}% on your ${gradeType.toLowerCase()} in ${className}.`,
        link: '/student/grades',
        metadata: { studentId, className, score, gradeType }
    });
}
/**
 * Helper: Notify about upcoming assignment due
 */
async function notifyAssignmentDue(userId, assignmentTitle, className, dueDate) {
    return await createNotification({
        userId,
        type: 'ASSIGNMENT_DUE',
        title: 'Assignment Due Soon',
        message: `"${assignmentTitle}" in ${className} is due on ${dueDate.toLocaleDateString()}.`,
        link: '/student/assignments'
    });
}
