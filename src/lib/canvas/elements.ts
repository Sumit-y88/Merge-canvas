// Element factory for creating new whiteboard shapes from a drag gesture.
import {
  createId,
  normalizeRect,
  snapVal,
  snapToShape,
  textDimensions,
  connectionTools,
} from "./geometry";

const STICKY_STROKE_COLORS = {
  "#fef08a": "#eab308",
  "#bfdbfe": "#3b82f6",
  "#bbf7d0": "#22c55e",
  "#fbcfe8": "#ec4899",
  "#e7e5e4": "#57534e",
  "#fed7aa": "#f97316",
};

const SHAPE_TOOLS = ["Rectangle", "Ellipse", "Line", "Arrow", "Sticky"];

/**
 * Build a canvas element from the current tool and a drag gesture.
 * `event` is required for Shift-constrained (square / 45deg) shapes.
 */
export const createElement = ({
  tool,
  start,
  end,
  event,
  color,
  fillColor,
  strokeWidth,
  strokeStyle,
  stickyColor,
  snapToGrid,
  elements,
  zoom,
}) => {
  let finish = end;

  if (event?.shiftKey && ["Rectangle", "Ellipse", "Sticky"].includes(tool)) {
    const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    finish = { x: start.x + Math.sign(end.x - start.x || 1) * size, y: start.y + Math.sign(end.y - start.y || 1) * size };
  }
  if (event?.shiftKey && connectionTools.includes(tool)) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const snap = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const length = Math.hypot(dx, dy);
    finish = { x: start.x + Math.cos(snap) * length, y: start.y + Math.sin(snap) * length };
  }

  const base = { id: createId(), strokeColor: color, fillColor, strokeWidth, strokeStyle, rotation: 0 };

  if (tool === "Sticky") {
    const rect = normalizeRect(start, finish);
    return {
      ...base,
      type: "sticky",
      x: snapVal(rect.x, snapToGrid),
      y: snapVal(rect.y, snapToGrid),
      width: Math.max(140, rect.width || 180),
      height: Math.max(120, rect.height || 140),
      fillColor: stickyColor,
      strokeColor: STICKY_STROKE_COLORS[stickyColor] || "#eab308",
      strokeWidth: 1.5,
      text: "",
      fontSize: 16,
    };
  }

  if (tool === "Rectangle" || tool === "Ellipse") {
    const rect = normalizeRect(start, finish);
    return {
      ...base,
      type: tool.toLowerCase(),
      x: snapVal(rect.x, snapToGrid),
      y: snapVal(rect.y, snapToGrid),
      width: snapVal(rect.width, snapToGrid),
      height: snapVal(rect.height, snapToGrid),
    };
  }

  if (connectionTools.includes(tool)) {
    const snappedStart = snapToShape(start, elements, zoom);
    const snappedEnd = snapToShape(finish, elements, zoom);
    return {
      ...base,
      type: tool.toLowerCase(),
      points: [snappedStart.point, snappedEnd.point],
      startConnection: snappedStart.elementId,
      endConnection: snappedEnd.elementId,
      startConnectionAnchor: snappedStart.anchorIndex,
      endConnectionAnchor: snappedEnd.anchorIndex,
    };
  }

  return { ...base, type: tool.toLowerCase(), points: [start, finish] };
};

/**
 * Create a text element from an editing session.
 */
export const createTextElement = ({ x, y, value, fontSize = 24, color }) => {
  const dimensions = textDimensions(value, fontSize);
  return {
    id: createId(),
    type: "text",
    x,
    y: y + fontSize,
    text: value,
    fontSize,
    ...dimensions,
    strokeColor: color,
    fillColor: "transparent",
    strokeWidth: 1,
    strokeStyle: "solid",
    rotation: 0,
  };
};

/**
 * Create an image element from an uploaded/dropped image.
 */
export const createImageElement = ({ src, x, y, width, height }) => ({
  id: createId(),
  type: "image",
  x,
  y,
  width,
  height,
  src,
  rotation: 0,
  strokeColor: "transparent",
  strokeStyle: "solid",
  strokeWidth: 0,
});

export const isShapeTool = (tool) => SHAPE_TOOLS.includes(tool);