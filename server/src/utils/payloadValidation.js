import dotenv from "dotenv";

dotenv.config();

const MAX_CANVAS_ELEMENTS = Number(process.env.MAX_CANVAS_ELEMENTS || 5000);
const MAX_CANVAS_BYTES = Number(process.env.MAX_CANVAS_BYTES || 8 * 1024 * 1024);
const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES || 2 * 1024 * 1024);
const MAX_POINTS = Number(process.env.MAX_FREEHAND_POINTS || 10000);
const allowedTypes = new Set(["rectangle", "ellipse", "line", "arrow", "freehand", "text", "sticky", "image"]);

const fail = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
};

export const validateCanvasData = (canvasData) => {
    if (!Array.isArray(canvasData)) fail("canvasData must be an array");
    if (canvasData.length > MAX_CANVAS_ELEMENTS) fail(`Canvas cannot contain more than ${MAX_CANVAS_ELEMENTS} elements`);

    const serializedSize = Buffer.byteLength(JSON.stringify(canvasData), "utf8");
    if (serializedSize > MAX_CANVAS_BYTES) fail("Canvas payload is too large");

    for (const element of canvasData) {
        if (!element || typeof element !== "object" || Array.isArray(element)) fail("Canvas elements must be objects");
        if (typeof element.id !== "string" || element.id.length < 1 || element.id.length > 100) fail("Canvas element id is invalid");
        if (typeof element.type !== "string" || !allowedTypes.has(element.type)) fail(`Unsupported canvas element type: ${element.type}`);

        for (const [key, value] of Object.entries(element)) {
            if (["x", "y", "x2", "y2", "width", "height", "rotation", "strokeWidth", "fontSize"].includes(key) && value !== undefined && (!Number.isFinite(value) || Math.abs(value) > 1000000)) {
                fail(`Canvas element ${key} is invalid`);
            }
        }
        if (element.type === "freehand" && (!Array.isArray(element.points) || element.points.length > MAX_POINTS)) fail("Freehand stroke is too large");
        if (typeof element.text === "string" && element.text.length > 10000) fail("Canvas text is too long");
        if (element.type === "image" && typeof element.src === "string" && Buffer.byteLength(element.src, "utf8") > MAX_IMAGE_BYTES * 1.4) fail("Image payload is too large");
    }
    return canvasData;
};

export const validateYjsUpdate = (update) => {
    if (typeof update !== "string" || update.length === 0 || update.length > Math.ceil(MAX_CANVAS_BYTES * 1.4)) fail("Yjs update is invalid or too large");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(update)) fail("Yjs update encoding is invalid");
    return update;
};
