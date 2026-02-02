// FILE: server/src/services/notification.service.ts
// 2026 Standard: Unified notification system for all automation events

import { NotificationChannel, NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

// ================= NOTIFICATION CREATION =================

interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
    channel?: NotificationChannel;
}

/**
 * Create a notification and push via Socket.IO for real-time updates
 */
export async function createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            channel: data.channel || 'IN_APP',
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata as any,
            status: 'PENDING'
        }
    });

    // Push real-time notification via Socket.IO
    try {
        const io = getIO();
        io.to(`user:${data.userId}`).emit('notification:new', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            createdAt: notification.createdAt
        });

        // Mark as sent
        await prisma.notification.update({
            where: { id: notification.id },
            data: { status: 'SENT', sentAt: new Date() }
        });
    } catch (error) {
        console.error('Socket notification failed:', error);
    }

    return notification;
}

/**
 * Create bulk notifications (e.g., for all parents of a class)
 */
export async function createBulkNotifications(
    userIds: string[],
    data: Omit<CreateNotificationData, 'userId'>
) {
    const notifications = await prisma.notification.createMany({
        data: userIds.map(userId => ({
            userId,
            type: data.type,
            channel: data.channel || 'IN_APP',
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata as any,
            status: 'PENDING' as NotificationStatus
        }))
    });

    // Push real-time notifications
    try {
        const io = getIO();
        for (const userId of userIds) {
            io.to(`user:${userId}`).emit('notification:new', {
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                createdAt: new Date()
            });
        }
    } catch (error) {
        console.error('Bulk socket notification failed:', error);
    }

    return notifications;
}

// ================= NOTIFICATION QUERIES =================

/**
 * Get user's notifications with pagination
 */
export async function getUserNotifications(userId: string, query: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };
    if (query.unreadOnly) where.isRead = false;
    if (query.type) where.type = query.type;

    const [total, notifications, unreadCount] = await prisma.$transaction([
        prisma.notification.count({ where }),
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({
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
export async function getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
        where: { userId, isRead: false }
    });
}

// ================= NOTIFICATION ACTIONS =================

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date(), status: 'READ' }
    });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date(), status: 'READ' }
    });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.deleteMany({
        where: { id: notificationId, userId }
    });
}

/**
 * Delete all read notifications older than X days
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
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
export async function notifyParentAboutAttendance(
    studentId: string,
    status: 'ABSENT' | 'LATE',
    className: string,
    date: Date
) {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { parent: { include: { user: true } } }
    });

    if (!student?.parent) return null;

    const type = status === 'ABSENT' ? 'ATTENDANCE_ABSENT' : 'ATTENDANCE_LATE';
    const statusText = status === 'ABSENT' ? 'marked absent' : 'arrived late';

    return await createNotification({
        userId: student.parent.userId,
        type: type as NotificationType,
        title: `Attendance Alert: ${student.firstName}`,
        message: `${student.firstName} was ${statusText} in ${className} on ${date.toLocaleDateString()}.`,
        link: `/parent/children/${studentId}/attendance`,
        metadata: { studentId, className, date: date.toISOString(), status }
    });
}

/**
 * Helper: Notify student about new grade
 */
export async function notifyStudentAboutGrade(
    studentId: string,
    userId: string,
    className: string,
    score: number,
    gradeType: string
) {
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
export async function notifyAssignmentDue(
    userId: string,
    assignmentTitle: string,
    className: string,
    dueDate: Date
) {
    return await createNotification({
        userId,
        type: 'ASSIGNMENT_DUE',
        title: 'Assignment Due Soon',
        message: `"${assignmentTitle}" in ${className} is due on ${dueDate.toLocaleDateString()}.`,
        link: '/student/assignments'
    });
}
