"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getUnreadMessagesBySender = exports.getUnreadCount = exports.sendMessage = exports.markAsRead = exports.getChatHistory = exports.getContacts = exports.sendClassMessage = exports.getClassConversation = void 0;
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));

// In-memory storage for class messages
const classMessages = new Map();

// Class-based chat
function getClassConversation(classId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const classInfo = yield prisma_1.default.class.findUnique({
            where: { id: classId },
            include: {
                teacher: { select: { id: true, firstName: true, lastName: true, userId: true } },
                subject: { select: { name: true, code: true } },
                enrollments: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true, userId: true } }
                    }
                }
            }
        });
        if (!classInfo) {
            throw new Error('Class not found');
        }
        const isTeacher = ((_a = classInfo.teacher) === null || _a === void 0 ? void 0 : _a.userId) === userId;
        const isEnrolled = classInfo.enrollments.some(e => e.student.userId === userId);
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN' || (user === null || user === void 0 ? void 0 : user.role) === 'SUPER_ADMIN';
        if (!isTeacher && !isEnrolled && !isAdmin) {
            throw new Error('You are not authorized to view this class conversation');
        }
        const messages = classMessages.get(classId) || [];
        return {
            id: classId,
            classInfo: {
                id: classInfo.id,
                name: classInfo.name,
                teacher: classInfo.teacher,
                subject: classInfo.subject
            },
            participants: [
                ...(classInfo.teacher ? [Object.assign(Object.assign({}, classInfo.teacher), { role: 'TEACHER' })] : []),
                ...classInfo.enrollments.map(e => (Object.assign(Object.assign({}, e.student), { role: 'STUDENT' })))
            ],
            messages
        };
    });
}
exports.getClassConversation = getClassConversation;

function sendClassMessage(classId, userId, content) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const classInfo = yield prisma_1.default.class.findUnique({
            where: { id: classId },
            include: {
                teacher: { select: { userId: true } },
                enrollments: { include: { student: { select: { userId: true } } } }
            }
        });
        if (!classInfo) {
            throw new Error('Class not found');
        }
        const isTeacher = ((_a = classInfo.teacher) === null || _a === void 0 ? void 0 : _a.userId) === userId;
        const isEnrolled = classInfo.enrollments.some(e => e.student.userId === userId);
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN' || (user === null || user === void 0 ? void 0 : user.role) === 'SUPER_ADMIN';
        if (!isTeacher && !isEnrolled && !isAdmin) {
            throw new Error('You are not authorized to send messages to this class');
        }
        const sender = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                teacherProfile: { select: { firstName: true, lastName: true } },
                studentProfile: { select: { firstName: true, lastName: true } },
                adminProfile: { select: { firstName: true, lastName: true } }
            }
        });
        const senderName = (sender === null || sender === void 0 ? void 0 : sender.teacherProfile) || (sender === null || sender === void 0 ? void 0 : sender.studentProfile) || (sender === null || sender === void 0 ? void 0 : sender.adminProfile) || { firstName: 'Unknown', lastName: 'User' };
        const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            classId,
            senderId: userId,
            sender: {
                id: userId,
                role: sender === null || sender === void 0 ? void 0 : sender.role,
                firstName: senderName.firstName,
                lastName: senderName.lastName
            },
            content,
            createdAt: new Date().toISOString()
        };
        if (!classMessages.has(classId)) {
            classMessages.set(classId, []);
        }
        classMessages.get(classId).push(message);
        const messages = classMessages.get(classId);
        if (messages.length > 100) {
            classMessages.set(classId, messages.slice(-100));
        }
        try {
            const io = (0, socket_1.getIO)();
            io.to(`class_${classId}`).emit('class_message', message);
        }
        catch (socketError) {
            console.error('Socket.io emission failed:', socketError);
        }
        return message;
    });
}
exports.sendClassMessage = sendClassMessage;

// Direct messaging
function getContacts(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const contacts = yield prisma_1.default.user.findMany({
            where: { id: { not: userId }, isActive: true },
            select: {
                id: true,
                email: true,
                role: true,
                adminProfile: { select: { firstName: true, lastName: true } },
                teacherProfile: { select: { firstName: true, lastName: true } },
                studentProfile: { select: { firstName: true, lastName: true } },
                parentProfile: { select: { firstName: true, lastName: true } }
            },
            orderBy: { email: 'asc' }
        });
        return contacts;
    });
}
exports.getContacts = getContacts;

function getChatHistory(userId, otherUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = yield prisma_1.default.chat.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, email: true, role: true } },
                receiver: { select: { id: true, email: true, role: true } }
            }
        });
        return messages;
    });
}
exports.getChatHistory = getChatHistory;

function markAsRead(userId, senderId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.chat.updateMany({
            where: { receiverId: userId, senderId: senderId, isRead: false },
            data: { isRead: true }
        });
    });
}
exports.markAsRead = markAsRead;

function sendMessage(senderId, receiverId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const receiver = yield prisma_1.default.user.findUnique({
            where: { id: receiverId },
            select: { isActive: true }
        });
        if (!receiver) {
            throw new Error('Receiver not found');
        }
        if (!receiver.isActive) {
            throw new Error('Receiver account is inactive');
        }
        const chatMessage = yield prisma_1.default.chat.create({
            data: { senderId, receiverId, message: message.trim(), isRead: false },
            include: {
                sender: { select: { id: true, email: true, role: true } },
                receiver: { select: { id: true, email: true, role: true } }
            }
        });
        try {
            const io = (0, socket_1.getIO)();
            io.to(`user_${receiverId}`).emit('new_message', chatMessage);
        }
        catch (socketError) {
            console.error('Socket.io emission failed:', socketError);
        }
        return chatMessage;
    });
}
exports.sendMessage = sendMessage;

function getUnreadCount(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.chat.count({
            where: { receiverId: userId, isRead: false }
        });
    });
}
exports.getUnreadCount = getUnreadCount;

function getUnreadMessagesBySender(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const unreadMessages = yield prisma_1.default.chat.findMany({
            where: { receiverId: userId, isRead: false },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        adminProfile: { select: { firstName: true, lastName: true } },
                        teacherProfile: { select: { firstName: true, lastName: true } },
                        studentProfile: { select: { firstName: true, lastName: true } },
                        parentProfile: { select: { firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const grouped = unreadMessages.reduce((acc, msg) => {
            const senderId = msg.senderId;
            if (!acc[senderId]) {
                acc[senderId] = { sender: msg.sender, count: 0, lastMessage: msg };
            }
            acc[senderId].count++;
            return acc;
        }, {});
        return Object.values(grouped);
    });
}
exports.getUnreadMessagesBySender = getUnreadMessagesBySender;

function deleteMessage(messageId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = yield prisma_1.default.chat.findUnique({
            where: { id: messageId },
            select: { senderId: true }
        });
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('You can only delete your own messages');
        }
        return yield prisma_1.default.chat.delete({ where: { id: messageId } });
    });
}
exports.deleteMessage = deleteMessage;
