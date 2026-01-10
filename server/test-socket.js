"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_1 = require("./lib/socket");
const httpServer = (0, http_1.createServer)();
(0, socket_1.initSocket)(httpServer);
try {
    const io = (0, socket_1.getIO)();
    console.log("✅ Socket Architecture is WORKING!");
}
catch (e) {
    console.error("❌ Socket Architecture Failed:", e);
}
