import * as Y from "yjs";
import Room from "../models/Room.model";

const elementsMap = (doc) => doc.getMap("elements");
const orderArray = (doc) => doc.getArray("elementOrder");

export const canvasToYDoc = (doc, canvasData = [], origin = "initial", prevCanvasData = null) => {
    doc.transact(() => {
        const elements = elementsMap(doc);
        const order = orderArray(doc);

        if (canvasData.length === 0 && (origin === "clear" || (prevCanvasData && prevCanvasData.length > 0))) {
            for (const id of [...elements.keys()]) {
                elements.delete(id);
            }
            if (order.length) {
                order.delete(0, order.length);
            }
            return;
        }

        const nextIds = new Set();
        const nextOrder = [];

        for (const element of canvasData) {
            if (!element?.id) continue;
            nextIds.add(element.id);
            nextOrder.push(element.id);
            const serialized = JSON.stringify(element);
            if (elements.get(element.id) !== serialized) {
                elements.set(element.id, serialized);
            }
        }

        if (prevCanvasData) {
            const prevIds = new Set(prevCanvasData.map((e) => e?.id).filter(Boolean));
            for (const id of prevIds) {
                if (!nextIds.has(id)) {
                    elements.delete(id);
                    let currentOrder = order.toArray();
                    let idx = currentOrder.indexOf(id);
                    while (idx !== -1) {
                        order.delete(idx, 1);
                        currentOrder = order.toArray();
                        idx = currentOrder.indexOf(id);
                    }
                }
            }
        } else if (origin === "initial" || origin === "remote" || origin === "replace") {
            for (const id of [...elements.keys()]) {
                if (!nextIds.has(id)) elements.delete(id);
            }
            const currentOrder = order.toArray();
            if (
                currentOrder.length !== nextOrder.length ||
                currentOrder.some((id, index) => id !== nextOrder[index])
            ) {
                if (order.length) order.delete(0, order.length);
                order.push(nextOrder);
            }
            return;
        }

        const existingOrderIds = new Set(order.toArray());
        for (const id of nextOrder) {
            if (!existingOrderIds.has(id)) {
                order.push([id]);
                existingOrderIds.add(id);
            }
        }
    }, origin);
};

export const yDocToCanvas = (doc) => {
    const elements = elementsMap(doc);
    const order = orderArray(doc).toArray();
    const orderedElements = [];
    const seenIds = new Set();

    for (const id of order) {
        if (seenIds.has(id)) continue;
        const value = elements.get(id);
        if (value) {
            try {
                const parsed = JSON.parse(value);
                if (parsed) {
                    orderedElements.push(parsed);
                    seenIds.add(id);
                }
            } catch {
                // Ignore invalid JSON
            }
        }
    }

    for (const [id, value] of elements.entries()) {
        if (!seenIds.has(id)) {
            try {
                const parsed = JSON.parse(value);
                if (parsed) {
                    orderedElements.push(parsed);
                    seenIds.add(id);
                }
            } catch {
                // Ignore invalid JSON
            }
        }
    }

    return orderedElements;
};

export const getRoomDoc = async (roomId) => {
    const room = await Room.findById(roomId).select("yjsState canvasData");
    if (!room) throw new Error("Room not found");

    const doc = new Y.Doc();
    if (room.yjsState?.length) {
        Y.applyUpdate(doc, new Uint8Array(room.yjsState));
    } else {
        canvasToYDoc(doc, room.canvasData || []);
    }
    return doc;
};

export const applyAndPersistUpdate = async (roomId, userId, updateBase64) => {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        const room = await Room.findById(roomId);
        if (!room) throw new Error("Room not found");

        const member = room.collaborators.find((item) => item.user.toString() === userId.toString());
        if (!member || !["owner", "editor"].includes(member.role)) {
            throw new Error("You do not have permission to edit this room");
        }

        const mergedDoc = new Y.Doc();
        if (room.yjsState?.length) {
            Y.applyUpdate(mergedDoc, new Uint8Array(room.yjsState));
        } else if (room.canvasData?.length) {
            canvasToYDoc(mergedDoc, room.canvasData, "initial");
        }

        const updateBuffer = Buffer.from(updateBase64, "base64");
        Y.applyUpdate(mergedDoc, updateBuffer);

        const savedAt = new Date();
        const canvasData = yDocToCanvas(mergedDoc);
        const nextState = Buffer.from(Y.encodeStateAsUpdate(mergedDoc));

        const updatedRoom = await Room.findOneAndUpdate(
            { _id: roomId, __v: room.__v },
            {
                $set: {
                    yjsState: nextState,
                    lastSyncedAt: savedAt,
                    canvasData,
                    canvasSavedAt: savedAt,
                },
                $inc: { __v: 1 },
            },
            { returnDocument: "after" }
        );

        if (updatedRoom) {
            return { savedAt: updatedRoom.canvasSavedAt, canvasData: updatedRoom.canvasData };
        }
    }

    throw new Error("Room changed while saving; please retry");
};
