"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const router = (0, express_1.Router)();
// We will eventually add "Middleware" here to ensure only ADMINs can do this
router.get('/', student_controller_1.getStudents);
router.post('/', student_controller_1.createStudent);
router.get('/:id', student_controller_1.getStudent);
router.post('/bulk', student_controller_1.createBulkStudents);
exports.default = router;
