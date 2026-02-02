// FILE: server/src/routes/department.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import * as DepartmentService from '../services/department.service';

const router = Router();

router.use(authenticate);

// GET /api/departments
router.get('/', async (req, res) => {
    try {
        const departments = await DepartmentService.getAllDepartments();
        res.json({ success: true, data: departments });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/departments/:id
router.get('/:id', async (req, res) => {
    try {
        const department = await DepartmentService.getDepartmentById(req.params.id);
        if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
        res.json({ success: true, data: department });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/departments (Admin only)
router.post(
    '/',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const department = await DepartmentService.createDepartment(req.body);
            res.status(201).json({ success: true, data: department });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// PUT /api/departments/:id (Admin only)
router.put(
    '/:id',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const department = await DepartmentService.updateDepartment(req.params.id, req.body);
            res.json({ success: true, data: department });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// DELETE /api/departments/:id (Admin only)
router.delete(
    '/:id',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            await DepartmentService.deleteDepartment(req.params.id);
            res.json({ success: true, message: 'Department deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// POST /api/departments/assign (Admin only)
router.post(
    '/assign',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { teacherId, departmentId } = req.body;
            const teacher = await DepartmentService.assignTeacherToDepartment(teacherId, departmentId);
            res.json({ success: true, data: teacher });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

export default router;
