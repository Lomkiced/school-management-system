"use strict";
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
exports.TeacherController = exports.toggleStatus = exports.updateTeacher = exports.createTeacher = exports.getTeacherById = exports.getTeachers = void 0;
const teacherService = __importStar(require("../services/teacher.service"));
const getTeachers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'ACTIVE';
        const departmentId = req.query.departmentId;
        const result = await teacherService.getAllTeachers({
            page, limit, search, status: status, departmentId
        });
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTeachers = getTeachers;
const getTeacherById = async (req, res) => {
    try {
        const teacher = await teacherService.getTeacherById(req.params.id);
        if (!teacher)
            return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, data: teacher });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTeacherById = getTeacherById;
const createTeacher = async (req, res) => {
    try {
        const teacher = await teacherService.createTeacher(req.body);
        res.status(201).json({ success: true, data: teacher });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createTeacher = createTeacher;
const updateTeacher = async (req, res) => {
    try {
        const teacher = await teacherService.updateTeacher(req.params.id, req.body);
        res.json({ success: true, data: teacher });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateTeacher = updateTeacher;
// === NEW: Status Toggle ===
const toggleStatus = async (req, res) => {
    try {
        await teacherService.toggleTeacherStatus(req.params.id);
        res.json({ success: true, message: "Teacher status updated" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.toggleStatus = toggleStatus;
// Export as Object
exports.TeacherController = {
    getTeachers: exports.getTeachers,
    getTeacherById: exports.getTeacherById,
    createTeacher: exports.createTeacher,
    updateTeacher: exports.updateTeacher,
    toggleStatus: exports.toggleStatus
};
