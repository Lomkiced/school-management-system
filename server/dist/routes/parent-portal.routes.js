"use strict";
// FILE: server/src/routes/parent-portal.routes.ts
// Parent portal routes
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parent_portal_controller_1 = require("../controllers/parent-portal.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.restrictTo)('PARENT'));
router.get('/dashboard', parent_portal_controller_1.getParentDashboard);
router.get('/children/:studentId', parent_portal_controller_1.getChildDetails);
exports.default = router;
