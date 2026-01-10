"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const class_controller_1 = require("../controllers/class.controller");
const router = (0, express_1.Router)();
router.get('/', class_controller_1.getClasses);
router.post('/', class_controller_1.createClass);
router.get('/options', class_controller_1.getOptions); // Fetch dropdown data
exports.default = router;
