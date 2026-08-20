import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Room from "../models/Room.model.js";
import TokenBlacklist from "../models/TokenBlacklist.model.js";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import * as Y from "yjs";
import { getRoomDoc, persistRoomDoc, replaceRoomDoc } from "./yjsRoomStore.js";
import { validateCanvasData, validateYjsUpdate } from "../utils/payloadValidation.js";
import { logger } from "../utils/logger.js";

const findMember = (room, userId) =>
    room?.collaborators.find((collaborator) => collaborator.user.toString() === userId.toString());

const yjsUpdateQueues = new Map();

const enqueueYjsUpdate = (roomId, task) => {
    const previous = yjsUpdateQueues.get(roomId) || Promise.resolve();
    const current = previous.catch(() => {}).then(task);
    yjsUpdateQueues.set(roomId, current);
    current.finally(() => {
        if (yjsUpdateQueues.get(roomId) === current) yjsUpdateQueues.delete(roomId);
    });
    return current;
};

const authenticateSocket = async (socket, next) => {
    try {
        const accessToken = socket.handshake.auth?.token;
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const isRevoked = decoded.type !== "access" || !decoded.jti || await TokenBlacklist.exists({ jti: decoded.jti });
        if (isRevoked) return next(new Error("Unauthorized socket connection"));

        const user = await User.findById(decoded.id).select("_id name email avatarColor");
        if (!user) return next(new Error("User not found"));
        socket.data.user = user;
        next();
    } catch {
        next(new Error("Unauthorized socket connection"));
    }
};

const registerRoomEvents = (socket) => {
    socket.on("room:join", async (roomId, acknowledge) => {
        try {
            const room = await Room.findById(roomId).select("collaborators canvasData isPublic");
            if (!room) throw new Error("Room not found");
            if (!room.isPublic && !findMember(room, socket.data.user._id)) {
                throw new Error("You are not a member of this room");
            }

            const previousRoomId = socket.data.roomId;
            if (previousRoomId && previousRoomId !== roomId) {
                socket.leave(previousRoomId);
                socket.to(previousRoomId).emit("presence:left", { userId: socket.data.user._id });
            }
            socket.join(roomId);
            socket.data.roomId = roomId;
            acknowledge?.({ ok: true });
            socket.to(roomId).emit("presence:joined", { user: socket.data.user });
        } catch (error) {
            acknowledge?.({ ok: false, message: error.message });
        }
    });

    socket.on("yjs:sync-request", async ({ roomId, stateVector } = {}, acknowledge) => {
        if (socket.data.roomId !== roomId || typeof stateVector !== "string") return;

        try {
            const doc = await getRoomDoc(roomId);
            const missingUpdate = Y.encodeStateAsUpdate(doc, Buffer.from(stateVector, "base64"));
            acknowledge?.({
                ok: true,
                update: Buffer.from(missingUpdate).toString("base64"),
                stateVector: Buffer.from(Y.encodeStateVector(doc)).toString("base64"),
            });
        } catch (error) {
            acknowledge?.({ ok: false, message: error.message });
        }
    });

    socket.on("yjs:update", async ({ roomId, update } = {}, acknowledge) => {
        if (socket.data.roomId !== roomId || typeof update !== "string") return;
        try { validateYjsUpdate(update); } catch (error) { acknowledge?.({ ok: false, message: error.message }); return; }

        enqueueYjsUpdate(roomId, async () => {
            const room = await Room.findById(roomId).select("collaborators");
            const member = findMember(room, socket.data.user._id);
            if (!member || !["owner", "editor"].includes(member.role)) {
                throw new Error("You do not have permission to edit this room");
            }

            const doc = await getRoomDoc(roomId);
            Y.applyUpdate(doc, Buffer.from(update, "base64"), "remote");
            const result = await persistRoomDoc(roomId, socket.data.user._id, doc);
            socket.to(roomId).emit("yjs:update", { update });
            socket.to(roomId).emit("canvas:snapshot", { canvasData: result.canvasData, updatedBy: socket.data.user._id });
            acknowledge?.({ ok: true, savedAt: result.savedAt });
        }).catch((error) => {
            acknowledge?.({ ok: false, message: error.message });
            socket.emit("canvas:error", { message: error.message });
        });
    });

    socket.on("canvas:snapshot", async ({ roomId, canvasData } = {}, acknowledge) => {
        if (socket.data.roomId !== roomId || !Array.isArray(canvasData)) return;
        try { validateCanvasData(canvasData); } catch (error) { acknowledge?.({ ok: false, message: error.message }); return; }

        enqueueYjsUpdate(roomId, async () => {
            const room = await Room.findById(roomId).select("collaborators");
            const member = findMember(room, socket.data.user._id);
            if (!member || !["owner", "editor"].includes(member.role)) {
                throw new Error("You do not have permission to edit this room");
            }

            const result = await replaceRoomDoc(roomId, socket.data.user._id, canvasData);
            socket.to(roomId).emit("canvas:snapshot", { canvasData: result.canvasData, updatedBy: socket.data.user._id });
            acknowledge?.({ ok: true, savedAt: result.savedAt });
        }).catch((error) => {
            acknowledge?.({ ok: false, message: error.message });
            socket.emit("canvas:error", { message: error.message });
        });
    });

    socket.on("cursor:move", ({ roomId, point } = {}) => {
        if (socket.data.roomId !== roomId || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
        socket.to(roomId).emit("cursor:update", {
            userId: socket.data.user._id,
            name: socket.data.user.name,
            color: socket.data.user.avatarColor,
            point,
        });
    });

    socket.on("disconnect", () => {
        if (socket.data.roomId) {
            socket.to(socket.data.roomId).emit("presence:left", { userId: socket.data.user._id });
        }
    });
};

export const configureSocketServer = (io) => {
    io.use(authenticateSocket);
    io.on("connection", registerRoomEvents);
};

export const configureSocketRedisAdapter = async (io) => {
    if (!process.env.REDIS_URL) return false;

    const options = { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false, retryStrategy: null };
    const publisher = new Redis(process.env.REDIS_URL, options);
    const subscriber = publisher.duplicate(options);

    try {
        await Promise.all([publisher.connect(), subscriber.connect()]);
        io.adapter(createAdapter(publisher, subscriber));
        io.redisAdapterClients = [publisher, subscriber];
        logger.info("socket_redis_adapter_enabled");
        return true;
    } catch (error) {
        logger.warn("socket_redis_adapter_unavailable", { error: error.message });
        publisher.disconnect();
        subscriber.disconnect();
        return false;
    }
};
