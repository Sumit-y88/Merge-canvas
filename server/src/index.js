import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { configureSocketRedisAdapter, configureSocketServer } from "./realtime/socketServer.js";
import mongoose from "mongoose";
import app, { clientOrigins } from "./app.js";
import { logger } from "./utils/logger.js";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: { origin: clientOrigins, credentials: true },
    maxHttpBufferSize: Number(process.env.MAX_CANVAS_BYTES || 8 * 1024 * 1024),
});
configureSocketServer(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await configureSocketRedisAdapter(io);
    app.locals.dbReady = true;
    httpServer.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
};

const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    io.close();
    httpServer.close(async () => {
        await Promise.all((io.redisAdapterClients || []).map((client) => client.quit().catch(() => client.disconnect())));
        await mongoose.disconnect();
        process.exit(0);
    });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (error) => logger.error("uncaught_exception", error));
process.on("unhandledRejection", (error) => logger.error("unhandled_rejection", error));

startServer().catch((error) => {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
});
