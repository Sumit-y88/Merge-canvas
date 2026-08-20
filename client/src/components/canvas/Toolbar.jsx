import {
  ArrowRight,
  Circle,
  Download,
  Eraser,
  HelpCircle,
  Image,
  LayoutTemplate,
  Magnet,
  Maximize2,
  Minus,
  MousePointer2,
  Pen,
  Redo2,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const tools = [
  ["Select", MousePointer2, "V / 1"],
  ["Sticky", StickyNote, "S"],
  ["Pen", Pen, "P / 6"],
  ["Rectangle", Square, "R / 2"],
  ["Ellipse", Circle, "O / 3"],
  ["Line", Minus, "L / 4"],
  ["Arrow", ArrowRight, "A / 5"],
  ["Text", Type, "T / 7"],
  ["Eraser", Eraser, "E / 8"],
];

const stickyColors = [
  { name: "Yellow", value: "#fef08a", stroke: "#eab308" },
  { name: "Blue", value: "#bfdbfe", stroke: "#3b82f6" },
  { name: "Green", value: "#bbf7d0", stroke: "#22c55e" },
  { name: "Pink", value: "#fbcfe8", stroke: "#ec4899" },
  { name: "Stone", value: "#e7e5e4", stroke: "#57534e" },
  { name: "Orange", value: "#fed7aa", stroke: "#f97316" },
];

const resolveColorInput = (color) => {
  if (!color?.startsWith("var(") || typeof window === "undefined") return color;
  const variable = color.match(/^var\((--[\w-]+)\)$/)?.[1];
  const channels = variable && getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const match = channels?.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return "#000000";
  const [h, s, l] = match.slice(1).map(Number);
  const chroma = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - chroma / 2;
  const rgb = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${rgb.map((value) => Math.round((value + m) * 255).toString(16).padStart(2, "0")).join("")}`;
};

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  strokeStyle,
  setStrokeStyle,
  stickyColor = "#fef08a",
  setStickyColor,
  gridStyle = "dot",
  setGridStyle,
  snapToGrid = false,
  setSnapToGrid,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onClear,
  onExport,
  onImageUpload,
  onOpenTemplates,
  onOpenShortcuts,
  history = {},
  disabled = false,
}) => (
  <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-lg max-w-[calc(100vw-1.5rem)] overflow-x-auto">
    {/* Main Tool Palette */}
    {tools.map(([name, Icon, shortcut]) => (
      <button
        key={name}
        type="button"
        disabled={disabled}
        onClick={() => setTool(name)}
        title={`${name} (${shortcut})`}
        className={`p-2.5 rounded-xl transition-all shrink-0 ${
          tool === name
            ? "bg-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Icon className="w-4 h-4" />
      </button>
    ))}

    {/* Image Upload Button */}
    <button
      type="button"
      disabled={disabled}
      onClick={onImageUpload}
      title="Upload Image (I)"
      className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0 disabled:opacity-40"
    >
      <Image className="w-4 h-4" />
    </button>

    <span className="h-7 w-px bg-border shrink-0" />

    {/* Sticky Note Color Preset Palette */}
    {tool === "Sticky" ? (
      <div className="flex items-center gap-1 shrink-0">
        {stickyColors.map((c) => (
          <button
            key={c.value}
            type="button"
            disabled={disabled}
            onClick={() => setStickyColor?.(c.value)}
            title={`Sticky note ${c.name}`}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              stickyColor === c.value ? "scale-110 border-primary shadow-xs" : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
    ) : (
      <>
        {/* Stroke Color */}
        <label title="Stroke color" className="shrink-0">
          <input
            disabled={disabled}
            type="color"
            value={resolveColorInput(color)}
            onChange={(event) => setColor(event.target.value)}
            className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0 disabled:cursor-not-allowed"
            aria-label="Stroke color"
          />
        </label>

        {/* Fill Color */}
        <label title="Fill color" className="shrink-0">
          <input
            disabled={disabled}
            type="color"
            value={fillColor === "transparent" ? "#ffffff" : fillColor}
            onChange={(event) => setFillColor(event.target.value)}
            className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0 disabled:cursor-not-allowed"
            aria-label="Fill color"
          />
        </label>

        <button
          disabled={disabled}
          type="button"
          title="Transparent fill"
          onClick={() => setFillColor("transparent")}
          className={`text-[10px] px-1.5 py-1 rounded border shrink-0 ${
            fillColor === "transparent" ? "border-primary text-primary" : "border-border text-muted-foreground"
          } disabled:opacity-40`}
        >
          No fill
        </button>

        {/* Stroke Style */}
        <select
          disabled={disabled}
          value={strokeStyle}
          onChange={(event) => setStrokeStyle(event.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-1 text-xs text-foreground disabled:opacity-40"
          aria-label="Stroke style"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>

        {/* Stroke Width */}
        <select
          disabled={disabled}
          value={strokeWidth}
          onChange={(event) => setStrokeWidth(Number(event.target.value))}
          className="h-8 w-20 rounded-lg border border-border bg-background px-1 text-xs text-foreground disabled:opacity-40"
          aria-label="Stroke width"
        >
          {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map((width) => (
            <option key={width} value={width}>
              {width}px
            </option>
          ))}
        </select>
      </>
    )}

    <span className="h-7 w-px bg-border shrink-0" />

    {/* Grid & Snap-to-Grid controls */}
    <div className="flex items-center gap-1 shrink-0">
      <select
        disabled={disabled}
        value={gridStyle}
        onChange={(event) => setGridStyle?.(event.target.value)}
        className="h-8 rounded-lg border border-border bg-background px-1 text-xs text-foreground disabled:opacity-40"
        title="Background Grid Style"
      >
        <option value="dot">Dots</option>
        <option value="grid">Gridlines</option>
        <option value="none">Blank</option>
      </select>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setSnapToGrid?.(!snapToGrid)}
        title={snapToGrid ? "Snap to Grid: ON" : "Snap to Grid: OFF"}
        className={`p-2 rounded-xl transition-all ${
          snapToGrid ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        } disabled:opacity-40`}
      >
        <Magnet className="w-4 h-4" />
      </button>
    </div>

    <span className="h-7 w-px bg-border shrink-0" />

    {/* Zoom Controls */}
    <button
      type="button"
      onClick={onZoomOut}
      title="Zoom out"
      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0"
    >
      <ZoomOut className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={onZoomReset}
      title="Reset zoom"
      className="min-w-12 px-1.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0"
    >
      {Math.round(zoom * 100)}%
    </button>
    <button
      type="button"
      onClick={onZoomIn}
      title="Zoom in"
      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0"
    >
      <ZoomIn className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={onZoomFit}
      title="Fit canvas to content"
      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0"
    >
      <Maximize2 className="w-4 h-4" />
    </button>

    <span className="h-7 w-px bg-border shrink-0" />

    {/* Templates Modal trigger */}
    <button
      type="button"
      disabled={disabled}
      onClick={onOpenTemplates}
      title="Canvas Templates"
      className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0 disabled:opacity-40"
    >
      <LayoutTemplate className="w-4 h-4" />
    </button>

    {/* Shortcuts Modal trigger */}
    <button
      type="button"
      onClick={onOpenShortcuts}
      title="Keyboard Shortcuts (?)"
      className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0"
    >
      <HelpCircle className="w-4 h-4" />
    </button>

    <span className="h-7 w-px bg-border shrink-0" />

    {/* History & Export */}
    <button
      type="button"
      title="Undo (Ctrl+Z)"
      onClick={history.undo}
      disabled={disabled || !history.canUndo}
      className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 shrink-0"
    >
      <Undo2 className="w-4 h-4" />
    </button>
    <button
      type="button"
      title="Redo (Ctrl+Shift+Z)"
      onClick={history.redo}
      disabled={disabled || !history.canRedo}
      className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 shrink-0"
    >
      <Redo2 className="w-4 h-4" />
    </button>
    <button
      type="button"
      disabled={disabled}
      onClick={onClear}
      title="Clear canvas"
      className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-30 shrink-0"
    >
      <Trash2 className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={onExport}
      title="Export canvas as PNG"
      className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0"
    >
      <Download className="w-4 h-4" />
    </button>
  </div>
);

export default Toolbar;
