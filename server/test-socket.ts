import { createServer } from 'http';
import { getIO, initSocket } from './lib/socket';

const httpServer = createServer();
initSocket(httpServer);

try {
    const io = getIO();
    console.log("✅ Socket Architecture is WORKING!");
} catch (e) {
    console.error("❌ Socket Architecture Failed:", e);
}