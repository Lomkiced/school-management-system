"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacher_controller_1 = require("../controllers/teacher.controller");
const router = (0, express_1.Router)();
router.get('/', teacher_controller_1.getTeachers);
router.post('/', teacher_controller_1.createTeacher);
exports.default = router;
