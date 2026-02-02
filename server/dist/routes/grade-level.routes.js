"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grade_level_controller_1 = require("../controllers/grade-level.controller");
const router = (0, express_1.Router)();
router.get('/', grade_level_controller_1.getGradeLevels);
router.post('/', grade_level_controller_1.createGradeLevel);
router.delete('/:id', grade_level_controller_1.deleteGradeLevel);
exports.default = router;
