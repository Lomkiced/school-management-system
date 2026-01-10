"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacher_portal_controller_1 = require("../controllers/teacher-portal.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/classes', auth_middleware_1.authenticate, teacher_portal_controller_1.getMyClasses);
exports.default = router;
