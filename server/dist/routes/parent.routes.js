"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/parent.routes.ts
const express_1 = require("express");
const parent_controller_1 = require("../controllers/parent.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Admins manage parents
router.get('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), parent_controller_1.getParents);
router.post('/', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), parent_controller_1.createParent);
router.patch('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), parent_controller_1.updateParent);
router.delete('/:id', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), parent_controller_1.deleteParent);
// Link Students
router.post('/:id/link', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), parent_controller_1.linkStudents);
exports.default = router;
