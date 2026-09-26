// Pure geometry and element-transform helpers for the whiteboard.

export const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const snapVal = (value, enabled = false, step = 20) =>
  enabled ? Math.round(value / step) * step : value;

export const textDimensions = (text = "", fontSize = 16) => {
  const lines = text.split("\n");
  return {
    width: Math.max(1, ...lines.map((line) => line.length)) * fontSize * 0.6,
    height: Math.max(1, lines.length) * fontSize * 1.2,
  };
};

export const getBounds = (element) => {
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
  if (element.x2 !== undefined && element.y2 !== undefined) {
    const minX = Math.min(element.x ?? 0, element.x2);
    const minY = Math.min(element.y ?? 0, element.y2);
    return {
      x: minX,
      y: minY,
      width: Math.abs(element.x2 - (element.x ?? 0)),
      height: Math.abs(element.y2 - (element.y ?? 0)),
    };
  }
  return { x: element.x ?? 0, y: element.y ?? 0, width: element.width ?? 0, height: element.height ?? 0 };
};

export const boundsFor = (elements) => {
  if (!elements?.length) return null;
  return elements.reduce((result, element) => {
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
};

export const containsPoint = (bounds, point, padding = 8) =>
  point.x >= bounds.x - padding &&
  point.x <= bounds.x + bounds.width + padding &&
  point.y >= bounds.y - padding &&
  point.y <= bounds.y + bounds.height + padding;

export const normalizeRect = (start, end) => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});

export const handlePoints = (bounds) => [
  [bounds.x, bounds.y],
  [bounds.x + bounds.width / 2, bounds.y],
  [bounds.x + bounds.width, bounds.y],
  [bounds.x, bounds.y + bounds.height / 2],
  [bounds.x + bounds.width, bounds.y + bounds.height / 2],
  [bounds.x, bounds.y + bounds.height],
  [bounds.x + bounds.width / 2, bounds.y + bounds.height],
  [bounds.x + bounds.width, bounds.y + bounds.height],
];

export const nearPoint = (point, target, padding) =>
  Math.hypot(point.x - target[0], point.y - target[1]) <= padding;

export const moveElement = (element, dx, dy) => ({
  ...element,
  ...(element.x !== undefined && element.x !== null ? { x: element.x + dx } : {}),
  ...(element.y !== undefined && element.y !== null ? { y: element.y + dy } : {}),
  ...(element.points ? { points: element.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) } : {}),
});

export const resizeElement = (element, original, next) => {
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
    fontSize:
      element.type === "text" || element.type === "sticky"
        ? Math.max(10, element.fontSize * scaleY)
        : element.fontSize,
  };
};

// --- Shape-to-shape connections -------------------------------------------

export const connectionTools = ["Line", "Arrow"];
export const connectableTypes = ["rectangle", "ellipse", "sticky"];

export const connectionAnchors = (element) => {
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

export const connectionPoint = (element, point, anchorIndex) => {
  const anchors = connectionAnchors(element);
  if (Number.isInteger(anchorIndex) && anchors[anchorIndex]) return anchors[anchorIndex];
  return anchors
    .map((anchor, index) => ({ anchor, index, distance: Math.hypot(anchor.x - point.x, anchor.y - point.y) }))
    .sort((left, right) => left.distance - right.distance)[0].anchor;
};

export const snapToShape = (point, elements, zoom) => {
  if (!elements?.length) return { point, elementId: null, anchorIndex: null };
  const candidate = elements
    .filter((element) => connectableTypes.includes(element.type))
    .flatMap((element) =>
      connectionAnchors(element).map((target, anchorIndex) => ({
        element,
        target,
        anchorIndex,
        distance: Math.hypot(target.x - point.x, target.y - point.y),
      }))
    )
    .sort((a, b) => a.distance - b.distance)[0];
  if (!candidate || candidate.distance > 18 / zoom) return { point, elementId: null, anchorIndex: null };
  return { point: candidate.target, elementId: candidate.element.id, anchorIndex: candidate.anchorIndex };
};

export const syncConnections = (items, changedId) =>
  items.map((element) => {
    if (!connectionTools.map((tool) => tool.toLowerCase()).includes(element.type) || !element.points) return element;
    const points = [...element.points];
    ["startConnection", "endConnection"].forEach((key, index) => {
      if (element[key] !== changedId) return;
      const shape = items.find((candidate) => candidate.id === changedId);
      if (shape)
        points[index] = connectionPoint(shape, points[index], element[index === 0 ? "startConnectionAnchor" : "endConnectionAnchor"]);
    });
    return { ...element, points };
  });