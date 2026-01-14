"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
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
// FILE: server/src/routes/grading.routes.ts
// 2026 Standard: Comprehensive grading routes with role-based access
const express_1 = require("express");
const gradingController = __importStar(require("../controllers/grading.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * GET /api/grading/:classId
 * Get complete gradebook for a class (class info, students, terms, grades)
 * Access: Teachers, Admins
 */
router.get('/:classId', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN', 'TEACHER'), gradingController.getGradebook);
/**
 * GET /api/grading
 * Get grades with optional filters (for student portal, etc.)
 * Access: All authenticated users
 */
router.get('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), gradingController.getGrades);
/**
 * POST /api/grading
 * Submit or update a grade
 * Access: Teachers, Admins
 */
router.post('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN', 'TEACHER'), gradingController.submitGrade);
exports.default = router;
