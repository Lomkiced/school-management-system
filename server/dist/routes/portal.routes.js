"use strict";
// FILE: server/src/routes/portal.routes.ts
// 2026 Standard: Student portal routes with comprehensive endpoints
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
const express_1 = require("express");
const portalController = __importStar(require("../controllers/portal.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// ==================== STUDENT PORTAL ====================
/**
 * GET /api/portal/grades
 * Get current student's grades
 */
router.get('/grades', (0, role_middleware_1.restrictTo)('STUDENT'), portalController.getMyGrades);
/**
 * GET /api/portal/my-classes
 * Get student's enrolled classes (for LMS)
 */
router.get('/my-classes', (0, role_middleware_1.restrictTo)('STUDENT'), portalController.getMyClasses);
/**
 * GET /api/portal/class/:classId
 * Get class details for student
 */
router.get('/class/:classId', (0, role_middleware_1.restrictTo)('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'), portalController.getClassInfo);
/**
 * GET /api/portal/dashboard
 * Get student dashboard data
 */
router.get('/dashboard', (0, role_middleware_1.restrictTo)('STUDENT'), portalController.getStudentDashboard);
exports.default = router;
