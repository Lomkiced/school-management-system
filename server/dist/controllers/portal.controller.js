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
exports.PortalController = exports.getMyGrades = exports.getStudentDashboard = exports.getClassInfo = exports.getMyClasses = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));

function getMyClasses(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const student = yield prisma_1.default.student.findUnique({
                where: { userId },
                include: {
                    enrollments: {
                        include: {
                            class: {
                                include: {
                                    teacher: { select: { firstName: true, lastName: true } },
                                    subject: { select: { id: true, name: true, code: true } },
                                    _count: { select: { enrollments: true } }
                                }
                            }
                        }
                    }
                }
            });
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }
            res.json({ success: true, data: student.enrollments, count: student.enrollments.length });
        }
        catch (error) {
            console.error('Get my classes error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch classes' });
        }
    });
}
exports.getMyClasses = getMyClasses;

function getClassInfo(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { classId } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            if (!classId || classId.length < 10) {
                return res.status(400).json({ success: false, message: 'Invalid class ID' });
            }
            const classInfo = yield prisma_1.default.class.findUnique({
                where: { id: classId },
                include: {
                    teacher: { select: { firstName: true, lastName: true } },
                    subject: { select: { name: true, code: true } },
                    _count: { select: { enrollments: true } }
                }
            });
            if (!classInfo) {
                return res.status(404).json({ success: false, message: 'Class not found' });
            }
            res.json({ success: true, data: classInfo });
        }
        catch (error) {
            console.error('Get class info error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch class info' });
        }
    });
}
exports.getClassInfo = getClassInfo;

function getStudentDashboard(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const student = yield prisma_1.default.student.findUnique({
                where: { userId },
                include: {
                    user: { select: { email: true } },
                    enrollments: { include: { class: { include: { subject: true } } } },
                    grades: { orderBy: { createdAt: 'desc' }, take: 5 }
                }
            });
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }
            const totalClasses = student.enrollments.length;
            const averageGrade = student.grades.length > 0
                ? (student.grades.reduce((sum, g) => sum + g.score, 0) / student.grades.length).toFixed(1)
                : null;
            res.json({
                success: true,
                data: {
                    studentInfo: {
                        name: `${student.firstName} ${student.lastName}`,
                        email: student.user.email,
                        id: student.id
                    },
                    stats: { totalClasses, averageGrade, recentGrades: student.grades.length },
                    enrollments: student.enrollments,
                    recentGrades: student.grades
                }
            });
        }
        catch (error) {
            console.error('Get student dashboard error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch dashboard' });
        }
    });
}
exports.getStudentDashboard = getStudentDashboard;

function getMyGrades(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const student = yield prisma_1.default.student.findUnique({
                where: { userId },
                include: {
                    grades: {
                        include: {
                            class: { include: { subject: true, teacher: true } },
                            term: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }
            const reportCard = student.grades.map(g => {
                var _a, _b;
                return ({
                    id: g.id,
                    subject: ((_a = g.class.subject) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                    code: ((_b = g.class.subject) === null || _b === void 0 ? void 0 : _b.code) || 'N/A',
                    className: g.class.name,
                    teacher: g.class.teacher ? `${g.class.teacher.lastName}, ${g.class.teacher.firstName}` : 'No Teacher',
                    term: g.term.name,
                    score: g.score,
                    feedback: g.feedback,
                    gradedAt: g.updatedAt
                });
            });
            res.json({
                success: true,
                data: reportCard,
                studentInfo: { name: `${student.firstName} ${student.lastName}`, studentId: student.id }
            });
        }
        catch (error) {
            console.error('Get grades error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch grades' });
        }
    });
}
exports.getMyGrades = getMyGrades;

exports.PortalController = { getMyClasses, getClassInfo, getStudentDashboard, getMyGrades };
