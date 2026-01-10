"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const router = (0, express_1.Router)();
router.post('/', enrollment_controller_1.enroll);
router.get('/options', enrollment_controller_1.getOptions);
exports.default = router;
