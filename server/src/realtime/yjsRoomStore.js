import * as Y from "yjs";
import Room from "../models/Room.model.js";

const roomDocs = new Map();
const cacheTtlMs = Number(process.env.YJS_ROOM_CACHE_TTL_MS || 30 * 60 * 1000);
const maxCachedRoomDocs = Number(process.env.MAX_CACHED_YJS_ROOMS || 1000);
const maxPersistRetries = 5;

const cacheRoomDoc = (roomId, doc) => {
    const key = roomId.toString();
    roomDocs.set(key, { doc, lastAccessedAt: Date.now() });

    if (roomDocs.size <= maxCachedRoomDocs) return;
    const oldestRoomId = [...roomDocs.entries()]
        .sort(([, left], [, right]) => left.lastAccessedAt - right.lastAccessedAt)[0]?.[0];
    if (oldestRoomId) roomDocs.delete(oldestRoomId);
};

export const evictIdleRoomDocs = (now = Date.now()) => {
    for (const [roomId, entry] of roomDocs) {
        if (now - entry.lastAccessedAt >= cacheTtlMs) roomDocs.delete(roomId);
    }
};

const roomDocCleanupInterval = setInterval(evictIdleRoomDocs, Math.min(cacheTtlMs, 60 * 1000));
roomDocCleanupInterval.unref();

const elementsMap = (doc) => doc.getMap("elements");
const orderArray = (doc) => doc.getArray("elementOrder");

export const canvasToYDoc = (doc, canvasData = [], origin = "initial") => {
    doc.transact(() => {
        const elements = elementsMap(doc);
        const order = orderArray(doc);
        elements.clear();
        if (order.length) order.delete(0, order.length);
        canvasData.forEach((element) => {
            if (!element?.id) return;
            elements.set(element.id, JSON.stringify(element));
            order.push([element.id]);
        });
    }, origin);
};

export const yDocToCanvas = (doc) => {
    const elements = elementsMap(doc);
    return orderArray(doc)
        .toArray()
        .map((id) => {
            const value = elements.get(id);
            try {
                return value ? JSON.parse(value) : null;
            } catch {
                return null;
            }
        })
        .filter(Boolean);
};

export const getRoomDoc = async (roomId) => {
    const key = roomId.toString();
    const cached = roomDocs.get(key);
    if (cached) {
        cached.lastAccessedAt = Date.now();
        return cached.doc;
    }

    const room = await Room.findById(roomId).select("yjsState canvasData");
    if (!room) throw new Error("Room not found");

    const doc = new Y.Doc();
    if (room.yjsState?.length) {
        Y.applyUpdate(doc, new Uint8Array(room.yjsState));
    } else {
        canvasToYDoc(doc, room.canvasData || []);
    }
    cacheRoomDoc(key, doc);
    return doc;
};

export const persistRoomDoc = async (roomId, userId, doc) => {
    for (let attempt = 0; attempt < maxPersistRetries; attempt += 1) {
        const room = await Room.findById(roomId);
        if (!room) throw new Error("Room not found");

        const member = room.collaborators.find((item) => item.user.toString() === userId.toString());
        if (!member || !["owner", "editor"].includes(member.role)) {
            throw new Error("You do not have permission to edit this room");
        }

        // Merge this instance's document with the latest persisted CRDT state before
        // writing. This keeps concurrent updates from other API instances intact.
        const mergedDoc = new Y.Doc();
        if (room.yjsState?.length) Y.applyUpdate(mergedDoc, new Uint8Array(room.yjsState));
        Y.applyUpdate(mergedDoc, Y.encodeStateAsUpdate(doc));

        const savedAt = new Date();
        const canvasData = yDocToCanvas(mergedDoc);
        const updatedRoom = await Room.findOneAndUpdate(
            { _id: roomId, __v: room.__v },
            {
                $set: {
                    yjsState: Buffer.from(Y.encodeStateAsUpdate(mergedDoc)),
                    lastSyncedAt: savedAt,
                    canvasData,
                    canvasSavedAt: savedAt,
                },
                $inc: { __v: 1 },
            },
            { new: true }
        );

        if (updatedRoom) {
            Y.applyUpdate(doc, Y.encodeStateAsUpdate(mergedDoc));
            cacheRoomDoc(roomId, doc);
            return { savedAt: updatedRoom.canvasSavedAt, canvasData: updatedRoom.canvasData };
        }
    }

    throw new Error("Room changed while saving; please retry");
};

export const replaceRoomDoc = async (roomId, userId, canvasData) => {
    const doc = await getRoomDoc(roomId);
    canvasToYDoc(doc, canvasData, "remote");
    return persistRoomDoc(roomId, userId, doc);
};

export const clearRoomDocs = (roomId) => {
    if (roomId === undefined) return roomDocs.clear();
    roomDocs.delete(roomId.toString());
};
