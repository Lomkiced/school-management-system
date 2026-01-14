"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/analytics.routes.ts
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Everyone needs the basic stats for the dashboard homepage
router.get('/stats', analytics_controller_1.getStats);
// Only Admins should see the financial charts
router.get('/charts', (0, role_middleware_1.restrictTo)('SUPER_ADMIN', 'ADMIN'), analytics_controller_1.getCharts);
exports.default = router;
