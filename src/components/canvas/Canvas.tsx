import { useCallback, useEffect, useRef, useState } from "react";
import {
  boundsFor,
  containsPoint,
  createId,
  getBounds,
  handlePoints,
  moveElement,
  nearPoint,
  normalizeRect,
  resizeElement,
  snapVal,
  syncConnections,
  textDimensions,
  connectableTypes,
} from "../../lib/canvas/geometry";
import { createElement, createTextElement, isShapeTool } from "../../lib/canvas/elements";
import {
  drawBackgroundGrid,
  drawCollaborationTag,
  drawElement,
  drawRemoteCursor,
  resolveCssColor,
} from "../../lib/canvas/render";

const getPoint = (event, canvas, zoom, pan) => {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left - pan.x) / zoom, y: (event.clientY - rect.top - pan.y) / zoom };
};

const getCanvasPosition = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

const RESIZE_CURSORS = ["nwse-resize", "ns-resize", "nesw-resize", "ew-resize", "ew-resize", "nesw-resize", "ns-resize", "nwse-resize"];

const stickyLivePreview = ({ id, x, y, width, height, text, fontSize, fillColor }) => ({
  id: id || "live-sticky-preview",
  type: "sticky",
  x,
  y,
  width: width || 180,
  height: height || 140,
  text,
  fillColor: fillColor || "#fef08a",
  strokeColor: "#eab308",
  fontSize: fontSize || 16,
  strokeWidth: 1.5,
  rotation: 0,
});

export interface CanvasProps {
  tool?: string;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  stickyColor?: string;
  gridStyle?: string;
  snapToGrid?: boolean;
  initialElements?: any[];
  remoteElements?: any[] | null;
  remoteCursors?: Record<string, any>;
  remoteDrafts?: Record<string, any>;
  readOnly?: boolean;
  clearRequest?: number;
  exportRequest?: number;
  zoomCommand?: any;
  onZoomChange?: (zoom: number) => void;
  onElementsChange?: (elements: any[]) => void;
  onDraftChange?: (draft: any) => void;
  onInteractionActiveChange?: (active: boolean) => void;
  onCursorMove?: (point: { x: number; y: number }) => void;
  onToolChange?: (tool: string) => void;
  onHistoryChange?: (controls: any) => void;
  onOpenShortcuts?: () => void;
}

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
  remoteDrafts = {},
  readOnly = false,
  clearRequest = 0,
  exportRequest = 0,
  zoomCommand = null,
  onZoomChange,
  onElementsChange,
  onDraftChange,
  onInteractionActiveChange,
  onCursorMove,
  onToolChange,
  onHistoryChange,
  onOpenShortcuts,
}: CanvasProps) => {
  const canvasRef = useRef(null);
  const interactionRef = useRef(null);
  const pendingRemoteElementsRef = useRef(null);
  const elementsRef = useRef(initialElements);
  const draftRef = useRef(null);
  const processedZoomCommandRef = useRef(null);
  const spacePressedRef = useRef(false);
  const activePointersRef = useRef(new Map());
  const pinchGestureRef = useRef(null);

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

  const forceRerender = useCallback(() => setRerenderTick((tick) => tick + 1), []);

  // --- Draft streaming helpers -------------------------------------------------
  const publishDraft = useCallback(
    (next) => {
      draftRef.current = next;
      setDraft(next);
      onDraftChange?.(next);
    },
    [onDraftChange]
  );

  useEffect(() => {
    onZoomChange?.(zoom);
  }, [onZoomChange, zoom]);

  useEffect(() => {
    if (!zoomCommand) return;
    if (processedZoomCommandRef.current === zoomCommand.id) return;
    processedZoomCommandRef.current = zoomCommand.id;
    // Zoom commands are imperative one-shot requests from the toolbar, so the
    // effect acts as a command dispatcher (mirrors clearRequest/exportRequest).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (zoomCommand.type === "reset") {
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
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [elements, zoomCommand]);

  useEffect(() => {
    if (!remoteElements) return;
    // A remote render must not replace the draft or elements being dragged.
    // Keep the latest state and install it as soon as the interaction finishes.
    if (interactionRef.current) {
      pendingRemoteElementsRef.current = remoteElements;
      return;
    }
    elementsRef.current = remoteElements;
    setElements(remoteElements);
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
      const previous = elementsRef.current;
      setHistory((state) => ({ past: [...state.past, previous], future: [] }));
      elementsRef.current = next;
      setElements(next);
      onElementsChange?.(next);
    },
    [onElementsChange]
  );

  const undo = useCallback(() => {
    if (!history.past.length) return;
    const past = [...history.past];
    const previous = past.pop();
    elementsRef.current = previous;
    setElements(previous);
    onElementsChange?.(previous);
    setHistory({ past, future: [elements, ...history.future] });
  }, [elements, history, onElementsChange]);

  const redo = useCallback(() => {
    if (!history.future.length) return;
    const [next, ...future] = history.future;
    elementsRef.current = next;
    setElements(next);
    onElementsChange?.(next);
    setHistory({ past: [...history.past, elements], future });
  }, [elements, history, onElementsChange]);

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

    // Grid
    context.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * pan.x, dpr * pan.y);
    drawBackgroundGrid(context, canvas, zoom, pan, gridStyle);

    // Elements
    elements.forEach((element) => drawElement(context, element, forceRerender));

    // Remote in-progress drafts (live drawing from other users)
    Object.entries(remoteDrafts).forEach(([, data]: [string, any]) => {
      const remoteDraft = data?.draft;
      const name = data?.name;
      const draftColor = data?.color;
      if (!remoteDraft) return;
      drawElement(context, remoteDraft, forceRerender);
      const bounds = getBounds(remoteDraft);
      if (bounds && Number.isFinite(bounds.x) && Number.isFinite(bounds.y)) {
        drawCollaborationTag(context, { x: bounds.x, y: bounds.y }, { name, color: draftColor, zoom });
      }
    });

    // Local active draft (drawn on top of committed elements but under the UI)
    if (draft) {
      drawElement(context, draft, forceRerender);
    }

    // Selection bounding box with handles + rotate affordance
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
    Object.values(remoteCursors).forEach((cursor) => drawRemoteCursor(context, cursor, zoom));
  }, [draft, elements, forceRerender, gridStyle, pan, remoteCursors, remoteDrafts, selectedIds, zoom]);

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

  // --- Keyboard shortcuts -------------------------------------------------------
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
        if (!readOnly) {
          if (event.shiftKey) redo();
          else undo();
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        if (!readOnly) redo();
        return;
      }
      const next = shortcuts[event.key.toLowerCase()];
      if (next && !event.ctrlKey && !event.metaKey) onToolChange?.(next);
      if ((event.key === "Delete" || event.key === "Backspace") && selectedIds.length && !readOnly) {
        event.preventDefault();
        setSelectedIds([]);
        commit(elementsRef.current.filter((element) => !selectedIds.includes(element.id)));
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
  }, [commit, onOpenShortcuts, onToolChange, readOnly, redo, selectedIds, undo]);

  // --- Interaction handlers ------------------------------------------------------
  const makeShape = useCallback(
    (start, end, event) =>
      createElement({
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
        elements: elementsRef.current,
        zoom,
      }),
    [color, fillColor, snapToGrid, stickyColor, strokeStyle, strokeWidth, tool, zoom]
  );

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
      if (handle >= 0) return setCanvasCursor(RESIZE_CURSORS[handle]);
    }
    const hit = [...elements].reverse().find((element) => containsPoint(getBounds(element), point));
    if (hit?.type === "text" || hit?.type === "sticky") return setCanvasCursor("text");
    return setCanvasCursor(hit ? "move" : "default");
  };

  const eraseAt = (point) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.type !== "erase") return;

    const current = elementsRef.current;
    const hits = current.filter(
      (element) => !interaction.erasedIds.includes(element.id) && containsPoint(getBounds(element), point, strokeWidth * 2)
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

  const startInteraction = (event) => {
    activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    // Handle 2-finger pinch-to-zoom & pan gesture on touch devices
    if (activePointersRef.current.size >= 2) {
      if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Ignore if pointer capture was already released
        }
      }
      if (interactionRef.current) {
        publishDraft(null);
        interactionRef.current = null;
      }
      setIsPanning(true);
      const pointers = Array.from(activePointersRef.current.values());
      const p1 = pointers[0];
      const p2 = pointers[1];
      const initialDistance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
      const clientMid = { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 };
      const canvas = canvasRef.current;
      if (canvas && initialDistance > 5) {
        const rect = canvas.getBoundingClientRect();
        const canvasPos = { x: clientMid.x - rect.left, y: clientMid.y - rect.top };
        const worldCenter = { x: (canvasPos.x - pan.x) / zoom, y: (canvasPos.y - pan.y) / zoom };
        pinchGestureRef.current = {
          initialDistance,
          initialZoom: zoom,
          initialPan: { ...pan },
          worldCenter,
        };
      }
      return;
    }

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

    if (isShapeTool(tool)) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = { type: "shape", start: point };
      publishDraft(makeShape(point, point, event));
      return;
    }

    if (tool === "Pen") {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = { type: "draw" };
      publishDraft({
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

  const moveInteraction = (event) => {
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    }

    if (activePointersRef.current.size >= 2 && pinchGestureRef.current) {
      const pointers = Array.from(activePointersRef.current.values());
      const p1 = pointers[0];
      const p2 = pointers[1];
      const currentDistance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
      const clientMid = { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 };
      const canvas = canvasRef.current;
      if (canvas && currentDistance > 5) {
        const scale = currentDistance / pinchGestureRef.current.initialDistance;
        const nextZoom = Math.min(3, Math.max(0.25, pinchGestureRef.current.initialZoom * scale));
        const rect = canvas.getBoundingClientRect();
        const canvasPos = { x: clientMid.x - rect.left, y: clientMid.y - rect.top };
        const nextPan = {
          x: canvasPos.x - pinchGestureRef.current.worldCenter.x * nextZoom,
          y: canvasPos.y - pinchGestureRef.current.worldCenter.y * nextZoom,
        };
        setZoom(nextZoom);
        setPan(nextPan);
      }
      return;
    }

    updateCanvasCursor(event);
    onCursorMove?.(getPoint(event, canvasRef.current, zoom, pan));
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
      if (draftRef.current) {
        const next = { ...draftRef.current, points: [...draftRef.current.points, point] };
        publishDraft(next);
      }
    } else if (interaction.type === "shape") {
      publishDraft(makeShape(interaction.start, point, event));
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
    if (event?.pointerId !== undefined) {
      activePointersRef.current.delete(event.pointerId);
    }

    if (pinchGestureRef.current) {
      if (activePointersRef.current.size < 2) {
        pinchGestureRef.current = null;
        setIsPanning(false);
        onInteractionActiveChange?.(false);
      }
      return;
    }

    const interaction = interactionRef.current;
    if (!interaction) {
      setIsPanning(false);
      onInteractionActiveChange?.(false);
      publishDraft(null);
      return;
    }

    const pendingRemote = pendingRemoteElementsRef.current;
    pendingRemoteElementsRef.current = null;
    const baseElements = pendingRemote || elementsRef.current;

    if (["draw", "shape"].includes(interaction.type) && draftRef.current) {
      const finishedDraft = draftRef.current;
      if (finishedDraft.type === "sticky") {
        setEditingText({
          id: finishedDraft.id,
          x: finishedDraft.x,
          y: finishedDraft.y,
          value: "",
          fontSize: finishedDraft.fontSize || 16,
          type: "sticky",
          width: finishedDraft.width,
          height: finishedDraft.height,
        });
      }
      const nextElements = [...baseElements.filter((element) => element.id !== finishedDraft.id), finishedDraft];
      commit(nextElements);
    } else if (["move", "resize", "rotate"].includes(interaction.type)) {
      const localModifiedMap = new Map(elementsRef.current.map((element) => [element.id, element]));
      const nextElements = baseElements.map((element) => localModifiedMap.get(element.id) || element);
      commit(nextElements);
    } else if (interaction.type === "erase") {
      const erasedSet = new Set(interaction.erasedIds || []);
      const nextElements = baseElements.filter((element) => !erasedSet.has(element.id));
      if (pendingRemote) {
        elementsRef.current = nextElements;
        setElements(nextElements);
      }
    } else if (pendingRemote) {
      elementsRef.current = pendingRemote;
      setElements(pendingRemote);
    }

    if (interaction.type === "marquee" && interaction.current) {
      const selection = normalizeRect(interaction.start, interaction.current);
      setSelectedIds(
        baseElements
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
    publishDraft(null);
    interactionRef.current = null;
    onInteractionActiveChange?.(false);
  };

  const commitText = () => {
    if (editingText?.id) {
      commit(
        elementsRef.current.map((element) => {
          if (element.id !== editingText.id) return element;
          if (element.type === "sticky") return { ...element, text: editingText.value };
          return { ...element, text: editingText.value, ...textDimensions(editingText.value, element.fontSize) };
        })
      );
    } else if (editingText?.value.trim()) {
      commit([
        ...elementsRef.current,
        createTextElement({
          x: editingText.x,
          y: editingText.y,
          value: editingText.value,
          fontSize: editingText.fontSize,
          color,
        }),
      ]);
    }
    setEditingText(null);
    publishDraft(null);
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
      if (typeof src !== "string") return;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const point = getPoint(event, canvasRef.current, zoom, pan);
        const aspect = img.width / Math.max(1, img.height);
        const defaultWidth = Math.min(400, Math.max(150, img.width));
        const defaultHeight = defaultWidth / aspect;
        commit([
          ...elementsRef.current,
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
            strokeStyle: "solid",
            strokeWidth: 0,
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
      if (event.ctrlKey || event.metaKey) {
        const position = getCanvasPosition(event, canvas);
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

    // Prevent mobile browser page drag, bounce, and pinch-zoom on canvas touches
    const preventCanvasTouchDefaults = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    canvas.addEventListener("touchstart", preventCanvasTouchDefaults, { passive: false });
    canvas.addEventListener("touchmove", preventCanvasTouchDefaults, { passive: false });
    canvas.addEventListener("touchend", preventCanvasTouchDefaults, { passive: false });
    canvas.addEventListener("touchcancel", preventCanvasTouchDefaults, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", preventCanvasTouchDefaults);
      canvas.removeEventListener("touchmove", preventCanvasTouchDefaults);
      canvas.removeEventListener("touchend", preventCanvasTouchDefaults);
      canvas.removeEventListener("touchcancel", preventCanvasTouchDefaults);
    };
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
          onChange={(event) => {
            const nextVal = event.target.value;
            const updated = { ...editingText, value: nextVal };
            setEditingText(updated);
            if (updated.type === "sticky") {
              onDraftChange?.(stickyLivePreview(updated));
            }
          }}
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