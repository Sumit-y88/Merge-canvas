import { useCallback, useEffect, useRef, useState } from "react";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const shapeTools = ["Rectangle", "Ellipse", "Line", "Arrow", "Sticky"];

const resolveCssColor = (color, fallback = "#1c1917") => {
  if (!color || color === "transparent") return color;
  if (typeof window === "undefined") return fallback;
  const match = color.match(/^var\((--[\w-]+)\)$/);
  if (!match) return color;
  const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return value ? `hsl(${value})` : fallback;
};

const imageCache = new Map();
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

const getPoint = (event, canvas, zoom, pan) => {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left - pan.x) / zoom, y: (event.clientY - rect.top - pan.y) / zoom };
};

const getCanvasPosition = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

const snapVal = (val, enabled = false, step = 20) => (enabled ? Math.round(val / step) * step : val);

const textDimensions = (text = "", fontSize = 16) => {
  const lines = text.split("\n");
  return {
    width: Math.max(1, ...lines.map((line) => line.length)) * fontSize * 0.6,
    height: Math.max(1, lines.length) * fontSize * 1.2,
  };
};

const getBounds = (element) => {
  if (element.type === "text") {
    const dimensions = textDimensions(element.text, element.fontSize);
    return {
      x: element.x,
      y: element.y - element.fontSize,
      width: element.width || dimensions.width,
      height: element.height || dimensions.height,
    };
  }
  if (element.points?.length) {
    const xs = element.points.map((point) => point.x);
    const ys = element.points.map((point) => point.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }
  return { x: element.x, y: element.y, width: element.width, height: element.height };
};

const boundsFor = (elements) =>
  elements.reduce((result, element) => {
    const current = getBounds(element);
    const x = Math.min(result.x, current.x);
    const y = Math.min(result.y, current.y);
    return {
      x,
      y,
      width: Math.max(result.x + result.width, current.x + current.width) - x,
      height: Math.max(result.y + result.height, current.y + current.height) - y,
    };
  }, getBounds(elements[0]));

const containsPoint = (bounds, point, padding = 8) =>
  point.x >= bounds.x - padding &&
  point.x <= bounds.x + bounds.width + padding &&
  point.y >= bounds.y - padding &&
  point.y <= bounds.y + bounds.height + padding;

const normalizeRect = (start, end) => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});

const connectionTools = ["Line", "Arrow"];
const connectableTypes = ["rectangle", "ellipse", "sticky"];

const connectionAnchors = (element) => {
  const bounds = getBounds(element);
  if (element.type === "ellipse") {
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const radiusX = Math.max(bounds.width / 2, 1);
    const radiusY = Math.max(bounds.height / 2, 1);
    const angles = [225, 270, 315, 180, 0, 135, 90, 45].map((degrees) => (degrees * Math.PI) / 180);
    return angles.map((angle) => ({ x: center.x + Math.cos(angle) * radiusX, y: center.y + Math.sin(angle) * radiusY }));
  }
  return handlePoints(bounds).map(([x, y]) => ({ x, y }));
};

const connectionPoint = (element, point, anchorIndex) => {
  const anchors = connectionAnchors(element);
  if (Number.isInteger(anchorIndex) && anchors[anchorIndex]) return anchors[anchorIndex];
  return anchors
    .map((anchor, index) => ({ anchor, index, distance: Math.hypot(anchor.x - point.x, anchor.y - point.y) }))
    .sort((left, right) => left.distance - right.distance)[0].anchor;
};

const snapToShape = (point, elements, zoom) => {
  const candidate = elements
    .filter((element) => connectableTypes.includes(element.type))
    .flatMap((element) => connectionAnchors(element).map((target, anchorIndex) => ({ element, target, anchorIndex, distance: Math.hypot(target.x - point.x, target.y - point.y) })))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!candidate || candidate.distance > 18 / zoom) return { point, elementId: null, anchorIndex: null };
  return { point: candidate.target, elementId: candidate.element.id, anchorIndex: candidate.anchorIndex };
};

const syncConnections = (items, changedId) =>
  items.map((element) => {
    if (!connectionTools.map((tool) => tool.toLowerCase()).includes(element.type) || !element.points) return element;
    const points = [...element.points];
    ["startConnection", "endConnection"].forEach((key, index) => {
      if (element[key] !== changedId) return;
      const shape = items.find((candidate) => candidate.id === changedId);
      if (shape) points[index] = connectionPoint(shape, points[index], element[index === 0 ? "startConnectionAnchor" : "endConnectionAnchor"]);
    });
    return { ...element, points };
  });

const handlePoints = (bounds) => [
  [bounds.x, bounds.y],
  [bounds.x + bounds.width / 2, bounds.y],
  [bounds.x + bounds.width, bounds.y],
  [bounds.x, bounds.y + bounds.height / 2],
  [bounds.x + bounds.width, bounds.y + bounds.height / 2],
  [bounds.x, bounds.y + bounds.height],
  [bounds.x + bounds.width / 2, bounds.y + bounds.height],
  [bounds.x + bounds.width, bounds.y + bounds.height],
];

const nearPoint = (point, target, padding) => Math.hypot(point.x - target[0], point.y - target[1]) <= padding;

const resizeElement = (element, original, next) => {
  const scaleY = original.height ? next.height / original.height : 1;
  if (element.points) {
    return {
      ...element,
      points: element.points.map((point) => ({
        x: next.x + (original.width ? (point.x - original.x) / original.width : 0.5) * next.width,
        y: next.y + (original.height ? (point.y - original.y) / original.height : 0.5) * next.height,
      })),
    };
  }
  return {
    ...element,
    x: next.x,
    y: next.y,
    width: next.width,
    height: next.height,
    fontSize: element.type === "text" || element.type === "sticky" ? Math.max(10, element.fontSize * scaleY) : element.fontSize,
  };
};

const drawFreehand = (context, points) => {
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

const contrastColor = (color) => {
  if (!color || color === "transparent") return "#111827";
  const value = color.replace("#", "");
  if (![3, 6].includes(value.length) || /[^0-9a-f]/i.test(value)) return "#111827";
  const hex = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  const [red, green, blue] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.55 ? "#111827" : "#f8fafc";
};

const drawBackgroundGrid = (context, canvas, zoom, pan, gridStyle) => {
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
    const [start, end] = element.points;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    if (element.type === "arrow") {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const size = Math.max(10, element.strokeWidth * 3);
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

const drawElement = (context, element, onLoaded) => {
  // The contrast pass was useful for text, but it created a second visible
  // outline around shapes—especially against the dark canvas background.
  if (element.type === "text") drawElementPath(context, element, true, onLoaded);
  drawElementPath(context, element, false, onLoaded);
};

const moveElement = (element, dx, dy) => ({
  ...element,
  x: element.x === undefined ? element.x : element.x + dx,
  y: element.y === undefined ? element.y : element.y + dy,
  points: element.points?.map((point) => ({ x: point.x + dx, y: point.y + dy })),
});

const Canvas = ({
  tool = "Select",
  color = "var(--primary)",
  fillColor = "transparent",
  strokeWidth = 4,
  strokeStyle = "solid",
  stickyColor = "#fef08a",
  gridStyle = "dot",
  snapToGrid = false,
  initialElements = [],
  remoteElements = null,
  remoteCursors = {},
  readOnly = false,
  clearRequest = 0,
  exportRequest = 0,
  zoomCommand = null,
  onZoomChange,
  onElementsChange,
  onInteractionActiveChange,
  onCursorMove,
  onToolChange,
  onHistoryChange,
  onOpenShortcuts,
}) => {
  const canvasRef = useRef(null);
  const interactionRef = useRef(null);
  const elementsRef = useRef(initialElements);
  const processedZoomCommandRef = useRef(null);
  const [elements, setElements] = useState(initialElements);
  const [selectedIds, setSelectedIds] = useState([]);
  const [draft, setDraft] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState({ past: [], future: [] });
  const [, setRerenderTick] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [canvasCursor, setCanvasCursor] = useState("default");
  const spacePressedRef = useRef(false);

  const forceRerender = useCallback(() => setRerenderTick((t) => t + 1), []);

  useEffect(() => {
    onZoomChange?.(zoom);
  }, [onZoomChange, zoom]);

  useEffect(() => {
    if (!zoomCommand) return;
    if (processedZoomCommandRef.current === zoomCommand.id) return;
    processedZoomCommandRef.current = zoomCommand.id;
    if (zoomCommand.type === "reset") {
      // eslint-disable-next-line
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    if (zoomCommand.type === "fit") {
      if (!elements.length || !canvasRef.current) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }
      const bounds = boundsFor(elements);
      const rect = canvasRef.current.getBoundingClientRect();
      const padding = 64;
      const nextZoom = Math.min(
        3,
        Math.max(
          0.25,
          Math.min((rect.width - padding) / Math.max(bounds.width, 1), (rect.height - padding) / Math.max(bounds.height, 1))
        )
      );
      setZoom(nextZoom);
      setPan({
        x: rect.width / 2 - (bounds.x + bounds.width / 2) * nextZoom,
        y: rect.height / 2 - (bounds.y + bounds.height / 2) * nextZoom,
      });
      return;
    }
    setZoom((current) => Math.min(3, Math.max(0.25, current * (zoomCommand.type === "in" ? 1.2 : 0.8))));
  }, [elements, zoomCommand]);

  useEffect(() => {
    if (!remoteElements) return;
    elementsRef.current = remoteElements;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElements(remoteElements);
    setSelectedIds([]);
    setDraft(null);
  }, [remoteElements]);

  useEffect(() => {
    if (!clearRequest) return;
    const current = elementsRef.current;
    elementsRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElements([]);
    setSelectedIds([]);
    setDraft(null);
    if (current.length) {
      setHistory((state) => ({ past: [...state.past, current], future: [] }));
    }
  }, [clearRequest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onCursorMove) return undefined;
    const handleCursorMove = (event) => onCursorMove(getPoint(event, canvas, zoom, pan));
    canvas.addEventListener("pointermove", handleCursorMove);
    return () => canvas.removeEventListener("pointermove", handleCursorMove);
  }, [onCursorMove, pan, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.style.pointerEvents = readOnly ? "none" : "auto";
    return () => {
      canvas.style.pointerEvents = "auto";
    };
  }, [readOnly]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !exportRequest) return;
    const link = document.createElement("a");
    link.download = `mergecanvas-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [exportRequest]);

  const commit = useCallback(
    (next) => {
      setElements((current) => {
        setHistory((state) => ({ past: [...state.past, current], future: [] }));
        elementsRef.current = next;
        return next;
      });
      onElementsChange?.(next);
    },
    [onElementsChange]
  );

  const undo = useCallback(
    () =>
      setHistory((state) => {
        if (!state.past.length) return state;
        const past = [...state.past];
        const previous = past.pop();
        elementsRef.current = previous;
        setElements(previous);
        onElementsChange?.(previous);
        return { past, future: [elements, ...state.future] };
      }),
    [elements, onElementsChange]
  );

  const redo = useCallback(
    () =>
      setHistory((state) => {
        if (!state.future.length) return state;
        const [next, ...future] = state.future;
        elementsRef.current = next;
        setElements(next);
        onElementsChange?.(next);
        return { past: [...state.past, elements], future };
      }),
    [elements, onElementsChange]
  );

  useEffect(() => {
    onHistoryChange?.({ canUndo: history.past.length > 0, canRedo: history.future.length > 0, undo, redo });
  }, [history.future.length, history.past.length, onHistoryChange, redo, undo]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    context.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * pan.x, dpr * pan.y);
    drawBackgroundGrid(context, canvas, zoom, pan, gridStyle);

    // Draw elements
    [...elements, ...(draft ? [draft] : [])].forEach((element) => drawElement(context, element, forceRerender));

    // Selection bounding box
    const selected = elements.filter((element) => selectedIds.includes(element.id));
    if (selected.length) {
      const bounds = boundsFor(selected);
      context.save();
      context.strokeStyle = resolveCssColor("var(--primary)");
      context.lineWidth = 1 / zoom;
      context.setLineDash([5 / zoom, 4 / zoom]);
      context.strokeRect(bounds.x - 5 / zoom, bounds.y - 5 / zoom, bounds.width + 10 / zoom, bounds.height + 10 / zoom);
      context.setLineDash([]);
      context.fillStyle = "#fff";
      context.strokeStyle = resolveCssColor("var(--primary)");

      const handles = [
        [bounds.x - 5 / zoom, bounds.y - 5 / zoom],
        [bounds.x + bounds.width / 2, bounds.y - 5 / zoom],
        [bounds.x + bounds.width + 5 / zoom, bounds.y - 5 / zoom],
        [bounds.x - 5 / zoom, bounds.y + bounds.height / 2],
        [bounds.x + bounds.width + 5 / zoom, bounds.y + bounds.height / 2],
        [bounds.x - 5 / zoom, bounds.y + bounds.height + 5 / zoom],
        [bounds.x + bounds.width / 2, bounds.y + bounds.height + 5 / zoom],
        [bounds.x + bounds.width + 5 / zoom, bounds.y + bounds.height + 5 / zoom],
      ];
      handles.forEach(([x, y]) => {
        context.fillRect(x - 3 / zoom, y - 3 / zoom, 6 / zoom, 6 / zoom);
        context.strokeRect(x - 3 / zoom, y - 3 / zoom, 6 / zoom, 6 / zoom);
      });

      context.beginPath();
      context.moveTo(bounds.x + bounds.width / 2, bounds.y - 5 / zoom);
      context.lineTo(bounds.x + bounds.width / 2, bounds.y - 25 / zoom);
      context.stroke();
      context.beginPath();
      context.arc(bounds.x + bounds.width / 2, bounds.y - 28 / zoom, 4 / zoom, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
    }

    // Remote cursors
    Object.values(remoteCursors).forEach((cursor) => {
      context.save();
      context.translate(cursor.point.x, cursor.point.y);
      const cursorColor = resolveCssColor(cursor.color || "var(--primary)");
      const scale = 1 / zoom;
      context.shadowColor = "rgba(15, 23, 42, 0.24)";
      context.shadowBlur = 5 * scale;
      context.fillStyle = cursorColor;
      context.strokeStyle = "#fff";
      context.lineWidth = 2 * scale;
      context.beginPath();
      context.arc(0, 0, 7 * scale, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.shadowBlur = 0;
      context.beginPath();
      context.arc(0, 0, 2.5 * scale, 0, Math.PI * 2);
      context.fillStyle = "#fff";
      context.fill();
      context.font = `${12 * scale}px sans-serif`;
      const label = cursor.name || "Collaborator";
      const labelWidth = context.measureText(label).width + 16 * scale;
      const labelHeight = 22 * scale;
      const labelX = 13 * scale;
      const labelY = -labelHeight / 2;
      context.fillStyle = cursorColor;
      context.beginPath();
      context.roundRect(labelX, labelY, labelWidth, labelHeight, 8 * scale);
      context.fill();
      context.fillStyle = "#fff";
      context.textBaseline = "middle";
      context.fillText(label, labelX + 8 * scale, 0);
      context.restore();
    });
  }, [draft, elements, forceRerender, gridStyle, pan, remoteCursors, selectedIds, zoom]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    render();
  }, [render]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    render();
  }, [render]);

  // Keyboard shortcuts
  useEffect(() => {
    const shortcuts = {
      v: "Select",
      1: "Select",
      s: "Sticky",
      r: "Rectangle",
      2: "Rectangle",
      o: "Ellipse",
      3: "Ellipse",
      l: "Line",
      4: "Line",
      a: "Arrow",
      5: "Arrow",
      p: "Pen",
      6: "Pen",
      t: "Text",
      7: "Text",
      e: "Eraser",
      8: "Eraser",
    };

    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        spacePressedRef.current = true;
        setCanvasCursor("grab");
        return;
      }
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) || event.target.isContentEditable) return;
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        onOpenShortcuts?.();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      const next = shortcuts[event.key.toLowerCase()];
      if (next && !event.ctrlKey && !event.metaKey) onToolChange?.(next);
      if ((event.key === "Delete" || event.key === "Backspace") && selectedIds.length) {
        event.preventDefault();
        setSelectedIds([]);
        commit(elements.filter((element) => !selectedIds.includes(element.id)));
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === "Space") {
        spacePressedRef.current = false;
        setCanvasCursor("default");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [commit, elements, onOpenShortcuts, onToolChange, redo, selectedIds, undo]);

  const makeShape = (start, end, event) => {
    let finish = end;
    if (event.shiftKey && ["Rectangle", "Ellipse", "Sticky"].includes(tool)) {
      const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
      finish = { x: start.x + Math.sign(end.x - start.x || 1) * size, y: start.y + Math.sign(end.y - start.y || 1) * size };
    }
    if (event.shiftKey && ["Line", "Arrow"].includes(tool)) {
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
      const strokeColorMap = {
        "#fef08a": "#eab308",
        "#bfdbfe": "#3b82f6",
        "#bbf7d0": "#22c55e",
        "#fbcfe8": "#ec4899",
        "#e7e5e4": "#57534e",
        "#fed7aa": "#f97316",
      };
      return {
        ...base,
        type: "sticky",
        x: snapVal(rect.x, snapToGrid),
        y: snapVal(rect.y, snapToGrid),
        width: Math.max(140, rect.width || 180),
        height: Math.max(120, rect.height || 140),
        fillColor: stickyColor,
        strokeColor: strokeColorMap[stickyColor] || "#eab308",
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

  const updateCanvasCursor = (event) => {
    if (isPanning || spacePressedRef.current) return setCanvasCursor("grab");
    if (tool === "Text") return setCanvasCursor("text");
    if (tool === "Eraser") return setCanvasCursor("cell");
    if (tool !== "Select") return setCanvasCursor("crosshair");

    const point = getPoint(event, canvasRef.current, zoom, pan);
    const selected = elements.filter((element) => selectedIds.includes(element.id));
    if (selected.length === 1) {
      const bounds = getBounds(selected[0]);
      if (nearPoint(point, [bounds.x + bounds.width / 2, bounds.y - 28], 10 / zoom)) return setCanvasCursor("grab");
      const handle = handlePoints(bounds).findIndex((target) => nearPoint(point, target, 10 / zoom));
      if (handle >= 0) {
        const resizeCursors = ["nwse-resize", "ns-resize", "nesw-resize", "ew-resize", "ew-resize", "nesw-resize", "ns-resize", "nwse-resize"];
        return setCanvasCursor(resizeCursors[handle]);
      }
    }
    const hit = [...elements].reverse().find((element) => containsPoint(getBounds(element), point));
    if (hit?.type === "text" || hit?.type === "sticky") return setCanvasCursor("text");
    return setCanvasCursor(hit ? "move" : "default");
  };

  const startInteraction = (event) => {
    onInteractionActiveChange?.(true);
    const point = getPoint(event, canvasRef.current, zoom, pan);
    const isPanGesture = event.button === 1 || spacePressedRef.current;

    if (isPanGesture) {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setIsPanning(true);
      interactionRef.current = { type: "pan", startClient: getCanvasPosition(event, canvasRef.current), origin: pan };
      return;
    }

    if (tool === "Text") {
      event.preventDefault();
      setEditingText({ x: point.x, y: point.y, value: "", fontSize: 24, type: "text" });
      return;
    }

    if (tool === "Sticky") {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = { type: "shape", start: point };
      setDraft(makeShape(point, point, event));
      return;
    }

    if (tool === "Pen") {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = { type: "draw" };
      setDraft({
        id: createId(),
        type: "freehand",
        points: [point],
        strokeColor: color,
        fillColor: "transparent",
        strokeWidth,
        strokeStyle,
        rotation: 0,
      });
      return;
    }

    if (shapeTools.includes(tool)) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = { type: "shape", start: point };
      setDraft(makeShape(point, point, event));
      return;
    }

    if (tool === "Eraser") {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = { type: "erase", erasedIds: [] };
      eraseAt(point);
      return;
    }

    if (tool !== "Select") return;

    const hitElement = [...elements].reverse().find((element) => containsPoint(getBounds(element), point));

    const selected = elements.filter((element) => selectedIds.includes(element.id));
    if (selected.length === 1) {
      const bounds = getBounds(selected[0]);
      const handles = handlePoints(bounds);
      const rotatePoint = [bounds.x + bounds.width / 2, bounds.y - 28];

      if (nearPoint(point, rotatePoint, 10 / zoom)) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        interactionRef.current = {
          type: "rotate",
          id: selected[0].id,
          originalElement: selected[0],
          originalBounds: bounds,
          startAngle: Math.atan2(point.y - (bounds.y + bounds.height / 2), point.x - (bounds.x + bounds.width / 2)),
        };
        return;
      }

      const handle = handles.findIndex((target) => nearPoint(point, target, 10 / zoom));
      if (handle >= 0) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        interactionRef.current = {
          type: "resize",
          id: selected[0].id,
          handle,
          originalElement: selected[0],
          originalBounds: bounds,
        };
        return;
      }
    }

    if (hitElement) {
      const nextIds = event.shiftKey
        ? selectedIds.includes(hitElement.id)
          ? selectedIds.filter((id) => id !== hitElement.id)
          : [...selectedIds, hitElement.id]
        : [hitElement.id];
      setSelectedIds(nextIds);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = { type: "move", start: point, ids: nextIds };
    } else {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setSelectedIds([]);
      interactionRef.current = { type: "marquee", start: point, current: point };
      setDraft({
        id: "selection",
        type: "rectangle",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor: color,
        fillColor: "transparent",
        strokeWidth: 1,
        strokeStyle: "dashed",
        rotation: 0,
      });
    }
  };

  const startTextEditing = (event) => {
    if (tool !== "Select" || readOnly) return;
    event.preventDefault();
    const point = getPoint(event, canvasRef.current, zoom, pan);
    const hitElement = [...elementsRef.current].reverse().find((element) => containsPoint(getBounds(element), point));
    if (hitElement?.type === "sticky" || hitElement?.type === "text") {
      setEditingText({
        id: hitElement.id,
        x: hitElement.x,
        y: hitElement.y,
        value: hitElement.text || "",
        fontSize: hitElement.fontSize || 16,
        type: hitElement.type,
        width: hitElement.width,
        height: hitElement.height,
      });
    } else {
      setEditingText({ x: point.x, y: point.y, value: "", fontSize: 24, type: "text" });
    }
  };

  const eraseAt = (point) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.type !== "erase") return;

    const current = elementsRef.current;
    const hits = current.filter(
      (element) =>
        !interaction.erasedIds.includes(element.id) &&
        containsPoint(getBounds(element), point, strokeWidth * 2)
    );
    if (!hits.length) return;

    const erasedIds = new Set(hits.map((element) => element.id));
    interaction.erasedIds.push(...erasedIds);
    const next = current.filter((element) => !erasedIds.has(element.id));
    elementsRef.current = next;
    setElements(next);
    setHistory((state) => ({ past: [...state.past, current], future: [] }));
    setSelectedIds((ids) => ids.filter((id) => !erasedIds.has(id)));
    onElementsChange?.(next);
  };

  const moveInteraction = (event) => {
    updateCanvasCursor(event);
    const interaction = interactionRef.current;
    if (!interaction) return;
    const point = getPoint(event, canvasRef.current, zoom, pan);

    if (interaction.type === "pan") {
      const currentClient = getCanvasPosition(event, canvasRef.current);
      setPan({
        x: interaction.origin.x + currentClient.x - interaction.startClient.x,
        y: interaction.origin.y + currentClient.y - interaction.startClient.y,
      });
    } else if (interaction.type === "draw") {
      setDraft((current) => current && { ...current, points: [...current.points, point] });
    } else if (interaction.type === "shape") {
      setDraft(makeShape(interaction.start, point, event));
    } else if (interaction.type === "erase") {
      eraseAt(point);
    } else if (interaction.type === "move") {
      const dx = snapVal(point.x - interaction.start.x, snapToGrid);
      const dy = snapVal(point.y - interaction.start.y, snapToGrid);
      const current = elementsRef.current;
      const next = syncConnections(
        current.map((element) => (interaction.ids.includes(element.id) ? moveElement(element, dx, dy) : element)),
        interaction.ids.find((id) => current.find((element) => element.id === id && connectableTypes.includes(element.type)))
      );
      elementsRef.current = next;
      setElements(next);
      interaction.start = point;
    } else if (interaction.type === "resize") {
      const original = interaction.originalBounds;
      const minSize = 20;
      const leftHandle = [0, 3, 5].includes(interaction.handle);
      const rightHandle = [2, 4, 7].includes(interaction.handle);
      const topHandle = [0, 1, 2].includes(interaction.handle);
      const bottomHandle = [5, 6, 7].includes(interaction.handle);
      const next = { ...original };

      if (leftHandle) {
        next.x = Math.min(point.x, original.x + original.width - minSize);
        next.width = original.x + original.width - next.x;
      } else if (rightHandle) next.width = Math.max(minSize, point.x - original.x);

      if (topHandle) {
        next.y = Math.min(point.y, original.y + original.height - minSize);
        next.height = original.y + original.height - next.y;
      } else if (bottomHandle) next.height = Math.max(minSize, point.y - original.y);

      const current = elementsRef.current;
      const updated = syncConnections(
        current.map((element) =>
          element.id === interaction.id ? resizeElement(interaction.originalElement, original, next) : element
        ),
        interaction.id
      );
      elementsRef.current = updated;
      setElements(updated);
    } else if (interaction.type === "rotate") {
      const center = {
        x: interaction.originalBounds.x + interaction.originalBounds.width / 2,
        y: interaction.originalBounds.y + interaction.originalBounds.height / 2,
      };
      const angle = Math.atan2(point.y - center.y, point.x - center.x) - interaction.startAngle;
      const updated = elementsRef.current.map((element) =>
        element.id === interaction.id ? { ...element, rotation: (interaction.originalElement.rotation || 0) + (angle * 180) / Math.PI } : element
      );
      elementsRef.current = updated;
      setElements(updated);
    } else if (interaction.type === "marquee") {
      interaction.current = point;
      setDraft((current) => current && { ...current, ...normalizeRect(interaction.start, point) });
    }
  };

  const finishInteraction = (event) => {
    const interaction = interactionRef.current;
    if (!interaction) {
      onInteractionActiveChange?.(false);
      return;
    }

    if (["draw", "shape"].includes(interaction.type) && draft) {
      if (draft.type === "sticky") {
        setEditingText({
          id: draft.id,
          x: draft.x,
          y: draft.y,
          value: "",
          fontSize: draft.fontSize || 16,
          type: "sticky",
          width: draft.width,
          height: draft.height,
        });
      }
      commit([...elements, draft]);
    }
    if (["move", "resize", "rotate"].includes(interaction.type)) commit(elementsRef.current);
    if (interaction.type === "marquee" && interaction.current) {
      const selection = normalizeRect(interaction.start, interaction.current);
      setSelectedIds(
        elements
          .filter((element) => {
            const bounds = getBounds(element);
            return (
              bounds.x >= selection.x &&
              bounds.y >= selection.y &&
              bounds.x + bounds.width <= selection.x + selection.width &&
              bounds.y + bounds.height <= selection.y + selection.height
            );
          })
          .map((element) => element.id)
      );
    }
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsPanning(false);
    setDraft(null);
    interactionRef.current = null;
    onInteractionActiveChange?.(false);
  };

  const commitText = () => {
    if (!editingText) return;

    if (editingText.id) {
      commit(
        elements.map((el) => {
          if (el.id !== editingText.id) return el;
          if (el.type === "sticky") return { ...el, text: editingText.value };
          return { ...el, text: editingText.value, ...textDimensions(editingText.value, el.fontSize) };
        })
      );
    } else if (editingText.value.trim()) {
      const fontSize = editingText.fontSize || 24;
      commit([
        ...elements,
        {
          id: createId(),
          type: "text",
          x: editingText.x,
          y: editingText.y + fontSize,
          text: editingText.value,
          fontSize,
          ...textDimensions(editingText.value, fontSize),
          strokeColor: color,
          fillColor: "transparent",
          strokeWidth: 1,
          strokeStyle: "solid",
          rotation: 0,
        },
      ]);
    }
    setEditingText(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const point = getPoint(event, canvasRef.current, zoom, pan);
        const aspect = img.width / Math.max(1, img.height);
        const defaultWidth = Math.min(400, Math.max(150, img.width));
        const defaultHeight = defaultWidth / aspect;

        commit([
          ...elements,
          {
            id: createId(),
            type: "image",
            x: snapVal(point.x - defaultWidth / 2, snapToGrid),
            y: snapVal(point.y - defaultHeight / 2, snapToGrid),
            width: defaultWidth,
            height: defaultHeight,
            src,
            rotation: 0,
            strokeColor: "transparent",
          },
        ]);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const position = getCanvasPosition(event, canvas);
      if (event.ctrlKey || event.metaKey) {
        const worldPoint = getPoint(event, canvas, zoom, pan);
        const nextZoom = Math.min(3, Math.max(0.25, zoom * Math.exp(-event.deltaY * 0.01)));
        setZoom(nextZoom);
        setPan({ x: position.x - worldPoint.x * nextZoom, y: position.y - worldPoint.y * nextZoom });
      } else {
        setPan((current) => ({ x: current.x - event.deltaX, y: current.y - event.deltaY }));
      }
    },
    [pan, zoom]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div className="absolute inset-0 overscroll-none" onDragOver={handleDragOver} onDrop={handleDrop}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none overscroll-none"
        style={{ cursor: isPanning ? "grabbing" : canvasCursor }}
        onPointerDown={startInteraction}
        onPointerMove={moveInteraction}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        onDoubleClick={startTextEditing}
        aria-label="Local whiteboard canvas"
      />
      {editingText && (
        <textarea
          autoFocus
          value={editingText.value}
          onChange={(event) => setEditingText((current) => ({ ...current, value: event.target.value }))}
          onBlur={commitText}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && editingText.type !== "sticky") {
              event.preventDefault();
              commitText();
            }
          }}
          className={`absolute z-20 resize-none border-2 border-primary bg-background p-2 text-foreground outline-none shadow-lg pointer-events-auto rounded-lg ${
            editingText.type === "sticky" ? "font-sans font-medium text-foreground" : ""
          }`}
          style={{
            left: editingText.x * zoom + pan.x + (editingText.type === "sticky" ? 12 * zoom : 0),
            top:
              editingText.type === "text"
                ? (editingText.y - editingText.fontSize) * zoom + pan.y
                : editingText.y * zoom + pan.y + 16 * zoom,
            width: editingText.type === "sticky" ? `${(editingText.width - 24) * zoom}px` : `${Math.max(220, (editingText.width || 320) * zoom)}px`,
            height: editingText.type === "sticky" ? `${(editingText.height - 28) * zoom}px` : `${Math.max(48, (editingText.height || 58) * zoom)}px`,
            fontSize: `${(editingText.fontSize || 16) * zoom}px`,
            backgroundColor: editingText.type === "sticky" ? "transparent" : undefined,
          }}
          placeholder={editingText.type === "sticky" ? "Type note here..." : "Type text..."}
        />
      )}
    </div>
  );
};

export default Canvas;
