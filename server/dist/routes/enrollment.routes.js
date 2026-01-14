"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/enrollment.routes.ts
const express_1 = require("express");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// 1. Lock down all routes
router.use(auth_middleware_1.authenticate);
// 2. Read Access (Teachers/Admins)
router.get('/options', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN', 'TEACHER'), enrollment_controller_1.getOptions);
// 3. Write Access (Admins Only)
// Switched from '/' to '/bulk' to be explicit
router.post('/bulk', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), enrollment_controller_1.enrollBulk);
exports.default = router;
