"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grading_controller_1 = require("../controllers/grading.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // Import Middleware
const router = (0, express_1.Router)();
// Protect these routes! Now req.user will exist.
router.post('/init', auth_middleware_1.authenticate, grading_controller_1.initialize);
router.get('/:classId', auth_middleware_1.authenticate, grading_controller_1.getGradebook);
router.post('/', auth_middleware_1.authenticate, grading_controller_1.submitGrade); // This was the culprit
exports.default = router;
