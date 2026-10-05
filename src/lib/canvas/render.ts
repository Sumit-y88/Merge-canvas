// Canvas 2D painting. Functions take the drawing context and mutate it only.
import { getBounds } from "./geometry";

const imageCache = new Map();

export const clearImageCache = () => imageCache.clear();

const getLoadedImage = (src, onLoaded) => {
  if (!src) return null;
  if (imageCache.has(src)) return imageCache.get(src);
  const img = new Image();
  img.src = src;
  img.onload = () => {
    imageCache.set(src, img);
    onLoaded?.();
  };
  return null;
};

export const resolveCssColor = (color, fallback = "#1c1917") => {
  if (!color || color === "transparent") return color;
  if (typeof window === "undefined") return fallback;
  const match = color.match(/^var\((--[\w-]+)\)$/);
  if (!match) return color;
  const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return value ? `hsl(${value})` : fallback;
};

const contrastColor = (color) => {
  if (!color || color === "transparent") return "#111827";
  const value = color.replace("#", "");
  if (![3, 6].includes(value.length) || /[^0-9a-f]/i.test(value)) return "#111827";
  const hex = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  const [red, green, blue] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.55 ? "#111827" : "#f8fafc";
};

export const drawFreehand = (context, points) => {
  if (!points.length) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length - 1; index += 1) {
    const midpoint = { x: (points[index].x + points[index + 1].x) / 2, y: (points[index].y + points[index + 1].y) / 2 };
    context.quadraticCurveTo(points[index].x, points[index].y, midpoint.x, midpoint.y);
  }
  const last = points[points.length - 1];
  context.lineTo(last.x, last.y);
  context.stroke();
};

export const drawBackgroundGrid = (context, canvas, zoom, pan, gridStyle) => {
  if (gridStyle === "none") return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const gridSize = 24;

  const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
  const endX = Math.ceil((width - pan.x) / zoom / gridSize) * gridSize;
  const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
  const endY = Math.ceil((height - pan.y) / zoom / gridSize) * gridSize;

  context.save();
  if (gridStyle === "grid") {
    context.strokeStyle = "rgba(148, 163, 184, 0.18)";
    context.lineWidth = 1 / zoom;
    context.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      context.moveTo(x, startY);
      context.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      context.moveTo(startX, y);
      context.lineTo(endX, y);
    }
    context.stroke();
  } else if (gridStyle === "dot") {
    context.fillStyle = "rgba(148, 163, 184, 0.35)";
    const dotRadius = Math.max(1, 1.2 / zoom);
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        context.beginPath();
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  context.restore();
};

const drawStickyNote = (context, element, outline = false) => {
  const bounds = getBounds(element);
  const rx = 12;
  const fillColor = element.fillColor || "#fef08a";
  const strokeColor = element.strokeColor || "#eab308";

  context.save();
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((element.rotation || 0) * Math.PI) / 180);
  context.translate(-(bounds.x + bounds.width / 2), -(bounds.y + bounds.height / 2));

  if (!outline) {
    context.shadowColor = "rgba(15, 23, 42, 0.16)";
    context.shadowBlur = 12;
    context.shadowOffsetY = 4;
  }

  context.beginPath();
  context.roundRect(element.x, element.y, element.width, element.height, rx);
  context.fillStyle = outline ? "transparent" : fillColor;
  context.fill();

  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.strokeStyle = outline ? contrastColor(strokeColor) : strokeColor;
  context.lineWidth = outline ? (element.strokeWidth || 1) + 2 : element.strokeWidth || 1.5;
  context.stroke();

  if (!outline) {
    context.fillStyle = strokeColor;
    context.globalAlpha = 0.3;
    context.beginPath();
    context.roundRect(element.x, element.y, element.width, 10, [rx, rx, 0, 0]);
    context.fill();
    context.globalAlpha = 1.0;
  }

  if (element.text) {
    context.fillStyle = "#1e293b";
    const fontSize = element.fontSize || 16;
    context.font = `${fontSize}px sans-serif`;
    context.textBaseline = "top";

    const padding = 14;
    const maxWidth = Math.max(10, element.width - padding * 2);
    const lineHeight = fontSize * 1.35;
    const lines = element.text.split("\n");
    let y = element.y + padding + 6;

    lines.forEach((lineText) => {
      const words = lineText.split(" ");
      let currentLine = "";
      for (let i = 0; i < words.length; i += 1) {
        const testLine = currentLine + (currentLine ? " " : "") + words[i];
        const testWidth = context.measureText(testLine).width;
        if (testWidth > maxWidth && i > 0) {
          context.fillText(currentLine, element.x + padding, y);
          currentLine = words[i];
          y += lineHeight;
          if (y + lineHeight > element.y + element.height - padding) break;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine && y + lineHeight <= element.y + element.height - padding) {
        context.fillText(currentLine, element.x + padding, y);
        y += lineHeight;
      }
    });
  }

  context.restore();
};

const drawImageElement = (context, element, outline = false, onLoaded) => {
  const bounds = getBounds(element);
  context.save();
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((element.rotation || 0) * Math.PI) / 180);
  context.translate(-(bounds.x + bounds.width / 2), -(bounds.y + bounds.height / 2));

  if (outline) {
    context.strokeStyle = resolveCssColor("var(--primary)");
    context.lineWidth = 2;
    context.strokeRect(element.x, element.y, element.width, element.height);
  } else {
    const loadedImg = getLoadedImage(element.src, onLoaded);
    if (loadedImg) {
      context.drawImage(loadedImg, element.x, element.y, element.width, element.height);
    } else {
      context.fillStyle = "#f1f5f9";
      context.fillRect(element.x, element.y, element.width, element.height);
      context.strokeStyle = "#cbd5e1";
      context.strokeRect(element.x, element.y, element.width, element.height);
      context.fillStyle = "#64748b";
      context.font = "14px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("Loading Image...", element.x + element.width / 2, element.y + element.height / 2);
    }
  }
  context.restore();
};

const drawElementPath = (context, element, outline = false, onLoaded) => {
  if (element.type === "sticky") {
    drawStickyNote(context, element, outline);
    return;
  }
  if (element.type === "image") {
    drawImageElement(context, element, outline, onLoaded);
    return;
  }

  context.save();
  const bounds = getBounds(element);
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((element.rotation || 0) * Math.PI) / 180);
  context.translate(-(bounds.x + bounds.width / 2), -(bounds.y + bounds.height / 2));
  const strokeColor = resolveCssColor(element.strokeColor);
  const fillColor = resolveCssColor(element.fillColor);
  context.strokeStyle = outline ? contrastColor(strokeColor) : strokeColor;
  context.fillStyle = outline || fillColor === "transparent" ? "transparent" : fillColor;
  context.lineWidth = outline ? (element.strokeWidth || 1) + 3 : element.strokeWidth || 1;
  context.setLineDash(element.strokeStyle === "dashed" ? [10, 8] : element.strokeStyle === "dotted" ? [2, 7] : []);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (element.type === "freehand") drawFreehand(context, element.points);
  if (element.type === "rectangle") {
    const radius = Math.min(14, Math.abs(element.width) / 4, Math.abs(element.height) / 4);
    context.beginPath();
    context.roundRect(element.x, element.y, element.width, element.height, radius);
    if (fillColor !== "transparent") context.fill();
    context.stroke();
  }
  if (element.type === "ellipse") {
    context.beginPath();
    context.ellipse(
      element.x + element.width / 2,
      element.y + element.height / 2,
      Math.abs(element.width / 2),
      Math.abs(element.height / 2),
      0,
      0,
      Math.PI * 2
    );
    if (fillColor !== "transparent") context.fill();
    context.stroke();
  }
  if (element.type === "line" || element.type === "arrow") {
    const start = element.points?.[0] || { x: element.x ?? 0, y: element.y ?? 0 };
    const end = element.points?.[1] || { x: element.x2 ?? (element.x ?? 0) + (element.width ?? 0), y: element.y2 ?? (element.y ?? 0) + (element.height ?? 0) };
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    if (element.type === "arrow") {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const size = Math.max(10, (element.strokeWidth || 1) * 3);
      context.beginPath();
      context.moveTo(end.x, end.y);
      context.lineTo(end.x - size * Math.cos(angle - Math.PI / 6), end.y - size * Math.sin(angle - Math.PI / 6));
      context.moveTo(end.x, end.y);
      context.lineTo(end.x - size * Math.cos(angle + Math.PI / 6), end.y - size * Math.sin(angle + Math.PI / 6));
      context.stroke();
    }
  }
  if (element.type === "text") {
    context.setLineDash([]);
    context.font = `${element.fontSize}px sans-serif`;
    const lineHeight = element.fontSize * 1.2;
    element.text.split("\n").forEach((line, index) => {
      const y = element.y + index * lineHeight;
      if (outline) {
        context.strokeStyle = contrastColor(element.strokeColor);
        context.lineWidth = 4;
        context.strokeText(line, element.x, y);
      } else {
        context.fillStyle = strokeColor;
        context.fillText(line, element.x, y);
      }
    });
  }
  context.restore();
};

export const drawElement = (context, element, onLoaded) => {
  // The contrast pass was useful for text, but it created a second visible
  // outline around shapes—especially against the dark canvas background.
  if (element.type === "text") drawElementPath(context, element, true, onLoaded);
  drawElementPath(context, element, false, onLoaded);
};

export const drawRemoteCursor = (context: any, cursor: any, zoom: number) => {
  if (!cursor?.point || typeof cursor.point.x !== "number" || typeof cursor.point.y !== "number") return;
  if (!Number.isFinite(cursor.point.x) || !Number.isFinite(cursor.point.y)) return;

  context.save();
  context.translate(cursor.point.x, cursor.point.y);
  const cursorColor = resolveCssColor(cursor.color || "var(--primary)");
  const scale = 1 / zoom;
  context.shadowColor = "rgba(15, 23, 42, 0.24)";
  context.shadowBlur = 7 * scale;
  context.fillStyle = cursorColor;
  context.strokeStyle = "#0f172a";
  context.lineJoin = "round";

  // The reference cursor's tip is aligned with the shared pointer location.
  context.scale(scale, scale);
  context.translate(-5.5, -3.21);
  context.lineWidth = 1.75;
  const pointer = new Path2D(
    "M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"
  );
  context.fill(pointer);
  context.stroke(pointer);
  context.shadowBlur = 0;

  context.font = "12px sans-serif";
  const label = cursor.name || "Collaborator";
  const labelWidth = Math.max(20, context.measureText(label).width + 16);
  const labelHeight = 22;
  const labelX = 15;
  const labelY = 25;
  context.fillStyle = cursorColor;
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(labelX, labelY, labelWidth, labelHeight, 6);
  } else {
    context.rect(labelX, labelY, labelWidth, labelHeight);
  }
  context.fill();
  context.fillStyle = "#fff";
  context.textBaseline = "middle";
  context.fillText(label, labelX + 8, labelY + labelHeight / 2);
  context.restore();
};

/** Small name pill rendered above a collaborator's live draft. */
export const drawCollaborationTag = (context, origin, { name, color, zoom }) => {
  const scale = 1 / zoom;
  const tagColor = resolveCssColor(color || "var(--primary)");
  context.font = `${Math.max(9, 11 * scale)}px sans-serif`;
  const label = `${name || "Collaborator"} (drawing)`;
  const labelWidth = context.measureText(label).width + 12 * scale;
  const labelHeight = 18 * scale;
  const tagX = origin.x;
  const tagY = origin.y - 22 * scale;

  context.save();
  context.fillStyle = tagColor;
  context.beginPath();
  context.roundRect(tagX, tagY, labelWidth, labelHeight, 4 * scale);
  context.fill();
  context.fillStyle = "#fff";
  context.textBaseline = "middle";
  context.fillText(label, tagX + 6 * scale, tagY + labelHeight / 2);
  context.restore();
};