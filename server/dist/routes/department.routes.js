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
// FILE: server/src/routes/department.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const DepartmentService = __importStar(require("../services/department.service"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/departments
router.get('/', async (req, res) => {
    try {
        const departments = await DepartmentService.getAllDepartments();
        res.json({ success: true, data: departments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// GET /api/departments/:id
router.get('/:id', async (req, res) => {
    try {
        const department = await DepartmentService.getDepartmentById(req.params.id);
        if (!department)
            return res.status(404).json({ success: false, message: 'Department not found' });
        res.json({ success: true, data: department });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// POST /api/departments (Admin only)
router.post('/', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const department = await DepartmentService.createDepartment(req.body);
        res.status(201).json({ success: true, data: department });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// PUT /api/departments/:id (Admin only)
router.put('/:id', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const department = await DepartmentService.updateDepartment(req.params.id, req.body);
        res.json({ success: true, data: department });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// DELETE /api/departments/:id (Admin only)
router.delete('/:id', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        await DepartmentService.deleteDepartment(req.params.id);
        res.json({ success: true, message: 'Department deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// POST /api/departments/assign (Admin only)
router.post('/assign', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { teacherId, departmentId } = req.body;
        const teacher = await DepartmentService.assignTeacherToDepartment(teacherId, departmentId);
        res.json({ success: true, data: teacher });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
