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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitGrade = exports.getGradebook = exports.initialize = void 0;
const auditService = __importStar(require("../services/audit.service"));
const gradingService = __importStar(require("../services/grading.service"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const initialize = async (req, res) => {
    try {
        const terms = await gradingService.initTerms();
        res.json({ success: true, data: terms });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.initialize = initialize;
const getGradebook = async (req, res) => {
    try {
        const data = await gradingService.getGradebook(req.params.classId);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getGradebook = getGradebook;
const submitGrade = async (req, res) => {
    try {
        const result = await gradingService.updateGrade(req.body);
        // SAFETY CHECK: Get User ID
        const user = req.user;
        const userId = user?.userId || user?.id;
        if (userId) {
            // PROFESSIONAL TOUCH: Fetch names instead of just logging IDs
            const student = await prisma_1.default.student.findUnique({
                where: { id: req.body.studentId }
            });
            const classInfo = await prisma_1.default.class.findUnique({
                where: { id: parseInt(req.body.classId) },
                include: { subject: true }
            });
            const studentName = student ? `${student.lastName}, ${student.firstName}` : 'Unknown Student';
            const subjectName = classInfo ? classInfo.subject.code : 'Unknown Class';
            // Log the HUMAN READABLE message
            await auditService.logAction(userId, 'GRADE_UPDATE', `Updated grade for ${studentName} in ${subjectName} to ${req.body.score}`);
        }
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error("Grading Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.submitGrade = submitGrade;
