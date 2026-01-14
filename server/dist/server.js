"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/server.ts
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const socket_1 = require("./lib/socket");
// Import Routes
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const grading_routes_1 = __importDefault(require("./routes/grading.routes"));
const lms_routes_1 = __importDefault(require("./routes/lms.routes"));
const parent_routes_1 = __importDefault(require("./routes/parent.routes"));
const portal_routes_1 = __importDefault(require("./routes/portal.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const teacher_portal_routes_1 = __importDefault(require("./routes/teacher-portal.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
// Initialize Socket.io
const io = (0, socket_1.initSocket)(httpServer);
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // Must match frontend URL exactly
    credentials: true // Allow cookies
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)()); // <--- CRITICAL: Parses cookies
// Static Files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/students', student_routes_1.default);
app.use('/api/teachers', teacher_routes_1.default);
app.use('/api/parents', parent_routes_1.default);
app.use('/api/classes', class_routes_1.default);
app.use('/api/enrollments', enrollment_routes_1.default);
app.use('/api/finance', finance_routes_1.default);
app.use('/api/grading', grading_routes_1.default);
app.use('/api/lms', lms_routes_1.default);
app.use('/api/portal', portal_routes_1.default);
app.use('/api/teacher-portal', teacher_portal_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
});
// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`\n🚀 SERVER RUNNING on http://localhost:${PORT}`);
});
