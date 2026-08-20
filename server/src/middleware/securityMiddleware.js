import dotenv from "dotenv";
import Redis from "ioredis";
import { logger } from "../utils/logger.js";

dotenv.config();

const requests = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 120;
const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false, retryStrategy: null })
    : null;
let redisReady;

const consumeRedisLimit = async (key) => {
    if (!redis) return null;
    try {
        redisReady ||= redis.connect().catch((error) => {
            logger.warn("redis_rate_limiter_unavailable", { error: error.message });
            return false;
        });
        if (!(await redisReady)) return null;
        const redisKey = `mergecanvas:auth-rate:${key}`;
        const count = await redis.incr(redisKey);
        if (count === 1) await redis.expire(redisKey, Math.ceil(WINDOW_MS / 1000));
        const ttl = await redis.ttl(redisKey);
        return { count, retryAfter: Math.max(1, ttl) };
    } catch (error) {
        logger.warn("redis_rate_limiter_error", { error: error.message });
        return null;
    }
};

export const securityHeaders = (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
};

export const authRateLimit = async (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const distributed = await consumeRedisLimit(key);
    if (distributed) {
        if (distributed.count > MAX_REQUESTS) {
            res.setHeader("Retry-After", distributed.retryAfter);
            return res.status(429).json({ message: "Too many authentication requests. Try again later." });
        }
        return next();
    }
    const current = requests.get(key);
    const entry = current && now - current.startedAt < WINDOW_MS
        ? current
        : { startedAt: now, count: 0 };

    entry.count += 1;
    requests.set(key, entry);

    if (entry.count > MAX_REQUESTS) {
        const retryAfter = Math.ceil((entry.startedAt + WINDOW_MS - now) / 1000);
        res.setHeader("Retry-After", retryAfter);
        return res.status(429).json({ message: "Too many authentication requests. Try again later." });
    }

    return next();
};

// Keep this process-local limiter bounded when the API is long-running.
setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, entry] of requests) {
        if (entry.startedAt < cutoff) requests.delete(key);
    }
}, WINDOW_MS).unref();
