import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoute.js";
import { authRateLimit, securityHeaders } from "./middleware/securityMiddleware.js";
import { requestLogger, logger } from "./utils/logger.js";

dotenv.config();

const normalizeOrigin = (origin) => origin.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");

export const clientOrigins = (process.env.CLIENT_URL || "https://merge-canvas.vercel.app")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
export const clientOrigin = clientOrigins[0];
const app = express();
app.locals.dbReady = false;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestLogger);
app.use(securityHeaders);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || clientOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
        return callback(new Error("Origin is not allowed"));
    },
    credentials: true,
}));
app.use(express.json({ limit: process.env.MAX_BODY_SIZE || "8mb" }));
app.get("/healthz", (req, res) => {
    const healthy = process.env.NODE_ENV === "test" || req.app.locals.dbReady !== false;
    res.status(healthy ? 200 : 503).json({ status: healthy ? "ok" : "unavailable" });
});
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.get("/", (req, res) => res.send("API is running..."));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    logger.error("request_error", error, { method: req.method, path: req.originalUrl });
    if (error.type === "entity.too.large") return res.status(413).json({ message: "Request payload is too large" });
    const status = error.message === "Origin is not allowed" ? 403 : error.statusCode || 500;
    return res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
});

export default app;
