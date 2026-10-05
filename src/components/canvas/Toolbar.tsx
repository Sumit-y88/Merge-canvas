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
  Palette,
  Pen,
  Redo2,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
  Grid,
} from "lucide-react";

export const tools = [
  { name: "Select", icon: MousePointer2, shortcut: "V", group: "select" },
  { name: "Pen", icon: Pen, shortcut: "P", group: "draw" },
  { name: "Text", icon: Type, shortcut: "T", group: "draw" },
  { name: "Sticky", icon: StickyNote, shortcut: "S", group: "draw" },
  { name: "Rectangle", icon: Square, shortcut: "R", group: "shapes" },
  { name: "Ellipse", icon: Circle, shortcut: "O", group: "shapes" },
  { name: "Line", icon: Minus, shortcut: "L", group: "shapes" },
  { name: "Arrow", icon: ArrowRight, shortcut: "A", group: "shapes" },
  { name: "Eraser", icon: Eraser, shortcut: "E", group: "edit" },
];

export const paletteColors = [
  { name: "Carbon Ink", value: "#1C1A17", border: "border-carbon" },
  { name: "Terracotta", value: "#D85A38", border: "border-terracotta" },
  { name: "Sage Mint", value: "#2E7D32", border: "border-emerald-700" },
  { name: "Canary Ochre", value: "#D4A017", border: "border-amber-600" },
  { name: "Soft Cobalt", value: "#2563EB", border: "border-blue-600" },
  { name: "Coral Rose", value: "#E11D48", border: "border-rose-600" },
];

export const stickyColors = [
  { name: "Canary Yellow", value: "#FFF6CC", stroke: "#E6D374" },
  { name: "Sage Mint", value: "#E2F0D9", stroke: "#B5CFAC" },
  { name: "Coral Pink", value: "#FDE2D2", stroke: "#E8AFA4" },
  { name: "Soft Sky", value: "#E0EDFF", stroke: "#AECDF0" },
];

export const strokeWidthPresets = [
  { label: "Fine", value: 2, dotSize: "w-1 h-1" },
  { label: "Medium", value: 4, dotSize: "w-2 h-2" },
  { label: "Bold", value: 8, dotSize: "w-3 h-3" },
  { label: "Heavy", value: 14, dotSize: "w-4 h-4" },
];

export const resolveColorInput = (color) => {
  if (!color?.startsWith("var(") || typeof window === "undefined") return color || "#1C1A17";
  const variable = color.match(/^var\((--[\w-]+)\)$/)?.[1];
  const channels = variable && getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const match = channels?.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return "#1C1A17";
  const [h, s, l] = match.slice(1).map(Number);
  const chroma = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - chroma / 2;
  const rgb = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${rgb.map((value) => Math.round((value + m) * 255).toString(16).padStart(2, "0")).join("")}`;
};

export interface HistoryControls {
  canUndo?: boolean;
  undo?: () => void;
  canRedo?: boolean;
  redo?: () => void;
  [key: string]: any;
}

export interface SideToolbarProps {
  tool: string;
  setTool: (tool: string) => void;
  onImageUpload?: () => void;
  onOpenTemplates?: () => void;
  history?: HistoryControls;
  onClear?: () => void;
  disabled?: boolean;
}

/**
 * SideToolbar: Physical Drafting Kit dock
 */
export const SideToolbar = ({
  tool,
  setTool,
  onImageUpload,
  onOpenTemplates,
  history = {},
  onClear,
  disabled = false,
}: SideToolbarProps) => (
  <nav
    aria-label="Drafting tools"
    className="rounded-DEFAULT p-1.5 flex flex-col items-center gap-1.5 bg-surface border-[2px] border-foreground shadow-stamp-lg transition-all"
  >
    {/* Select tool */}
    <button
      type="button"
      disabled={disabled}
      onClick={() => setTool("Select")}
      title="Select (V)"
      className={`group relative p-2 rounded-DEFAULT transition-all shrink-0 ${
        tool === "Select"
          ? "bg-primary text-white border border-foreground shadow-stamp-xs"
          : "text-foreground hover:bg-secondary border border-transparent hover:border-foreground/40"
      }`}
    >
      <MousePointer2 className="w-4 h-4" />
      <span className="sr-only">Select tool</span>
    </button>

    <div className="w-5 h-[1.5px] bg-foreground/20 my-0.5" />

    {/* Creation Tools */}
    {[
      { name: "Pen", icon: Pen, title: "Pen (P)" },
      { name: "Text", icon: Type, title: "Text (T)" },
      { name: "Sticky", icon: StickyNote, title: "Sticky Note (S)" },
      { name: "Rectangle", icon: Square, title: "Rectangle (R)" },
      { name: "Ellipse", icon: Circle, title: "Ellipse (O)" },
      { name: "Line", icon: Minus, title: "Line (L)" },
      { name: "Arrow", icon: ArrowRight, title: "Arrow (A)" },
      { name: "Eraser", icon: Eraser, title: "Eraser (E)" },
    ].map((item) => {
      const Icon = item.icon;
      const isActive = tool === item.name;
      return (
        <button
          key={item.name}
          type="button"
          disabled={disabled}
          onClick={() => setTool(item.name)}
          title={item.title}
          className={`group relative p-2 rounded-DEFAULT transition-all shrink-0 ${
            isActive
              ? "bg-primary text-white border border-foreground shadow-stamp-xs"
              : "text-foreground hover:bg-secondary border border-transparent hover:border-foreground/40"
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="sr-only">{item.name}</span>
        </button>
      );
    })}

    <div className="w-5 h-[1.5px] bg-foreground/20 my-0.5" />

    {/* Media & Templates */}
    <button
      type="button"
      disabled={disabled}
      onClick={onImageUpload}
      title="Upload Image (I)"
      className="p-2 rounded-DEFAULT text-foreground hover:bg-secondary border border-transparent hover:border-foreground/40 transition-all shrink-0"
    >
      <Image className="w-4 h-4" />
      <span className="sr-only">Upload Image</span>
    </button>

    <button
      type="button"
      disabled={disabled}
      onClick={onOpenTemplates}
      title="Architectural Blueprints"
      className="p-2 rounded-DEFAULT text-foreground hover:bg-secondary border border-transparent hover:border-foreground/40 transition-all shrink-0"
    >
      <LayoutTemplate className="w-4 h-4" />
      <span className="sr-only">Templates</span>
    </button>

    <div className="w-5 h-[1.5px] bg-foreground/20 my-0.5" />

    {/* Undo / Redo */}
    <button
      type="button"
      disabled={disabled || !history?.canUndo}
      onClick={history?.undo}
      title="Undo (Ctrl+Z)"
      className="p-2 rounded-DEFAULT text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent disabled:opacity-30 transition-all shrink-0"
    >
      <Undo2 className="w-3.5 h-3.5" />
      <span className="sr-only">Undo</span>
    </button>

    <button
      type="button"
      disabled={disabled || !history?.canRedo}
      onClick={history?.redo}
      title="Redo (Ctrl+Y)"
      className="p-2 rounded-DEFAULT text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent disabled:opacity-30 transition-all shrink-0"
    >
      <Redo2 className="w-3.5 h-3.5" />
      <span className="sr-only">Redo</span>
    </button>

    <button
      type="button"
      disabled={disabled}
      onClick={onClear}
      title="Clear Canvas"
      className="p-2 rounded-DEFAULT text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent transition-all shrink-0"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span className="sr-only">Clear</span>
    </button>
  </nav>
);

export interface BottomToolbarProps {
  tool: string;
  color: string;
  setColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  strokeStyle: string;
  setStrokeStyle: (style: string) => void;
  stickyColor: string;
  setStickyColor: (color: string) => void;
  gridStyle: string;
  setGridStyle: (style: string) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean | ((prev: boolean) => boolean)) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  onExport: () => void;
  onOpenShortcuts: () => void;
  disabled?: boolean;
}

/**
 * BottomToolbar: Physical Workshop Toolbelt dock
 */
export const BottomToolbar = ({
  tool,
  color,
  setColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  strokeStyle,
  setStrokeStyle,
  stickyColor,
  setStickyColor,
  gridStyle,
  setGridStyle,
  snapToGrid,
  setSnapToGrid,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onExport,
  onOpenShortcuts,
  disabled = false,
}: BottomToolbarProps) => {
  const isSticky = tool === "Sticky";
  const isShape = ["Rectangle", "Ellipse"].includes(tool);
  const isDrawOrLine = ["Pen", "Line", "Arrow", "Rectangle", "Ellipse", "Text"].includes(tool);

  const cycleGridStyle = () => {
    if (gridStyle === "dot") setGridStyle("grid");
    else if (gridStyle === "grid") setGridStyle("none");
    else setGridStyle("dot");
  };

  return (
    <div className="flex items-center gap-2 max-w-[95vw] overflow-x-auto p-1.5 rounded-DEFAULT bg-surface border-[2px] border-foreground shadow-stamp-lg transition-all">
      {/* 1. Color Palette / Pigment Wells */}
      {isSticky ? (
        <div className="flex items-center gap-1.5 px-2 py-0.5 border-r border-foreground/20 shrink-0">
          <span className="text-[10px] font-label font-bold uppercase text-muted-foreground mr-1">
            Note Tint:
          </span>
          {stickyColors.map((sc) => (
            <button
              key={sc.name}
              type="button"
              disabled={disabled}
              onClick={() => setStickyColor(sc.value)}
              title={sc.name}
              style={{ backgroundColor: sc.value }}
              className={`w-5 h-5 rounded-DEFAULT border-[1.5px] border-foreground transition-transform shrink-0 ${
                stickyColor === sc.value ? "scale-110 shadow-stamp-xs" : "hover:scale-105"
              }`}
            />
          ))}
        </div>
      ) : isDrawOrLine ? (
        <div className="flex items-center gap-1 px-1.5 py-0.5 border-r border-foreground/20 shrink-0">
          <span className="text-[10px] font-label font-bold uppercase text-muted-foreground mr-1 hidden sm:inline">
            Ink:
          </span>
          {paletteColors.map((c) => {
            const isSelected = color === c.value;
            return (
              <button
                key={c.name}
                type="button"
                disabled={disabled}
                onClick={() => setColor(c.value)}
                title={c.name}
                style={{ backgroundColor: c.value }}
                className={`w-5 h-5 rounded-DEFAULT border-[1.5px] border-foreground transition-transform shrink-0 ${
                  isSelected ? "scale-110 shadow-stamp-xs" : "hover:scale-105"
                }`}
              />
            );
          })}

          {/* Custom color input */}
          <div className="relative w-5 h-5 ml-1 shrink-0">
            <input
              type="color"
              disabled={disabled}
              value={resolveColorInput(color)}
              onChange={(e) => setColor(e.target.value)}
              title="Custom Ink Well"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div
              className="w-5 h-5 rounded-DEFAULT border-[1.5px] border-foreground flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
              title="Pick custom color"
            >
              <Palette className="w-2.5 h-2.5 text-foreground" />
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Shape Fill Swatch Toggle */}
      {isShape && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 border-r border-foreground/20 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              setFillColor(fillColor === "transparent" ? color || "#1C1A17" : "transparent")
            }
            title={fillColor === "transparent" ? "Enable solid fill" : "Clear fill"}
            className="flex items-center gap-1 px-2 py-1 text-xs font-label font-semibold rounded-DEFAULT border border-foreground/60 bg-surface hover:bg-secondary transition-colors"
          >
            <span
              className="w-3 h-3 rounded-sm border border-foreground"
              style={{
                backgroundColor: fillColor === "transparent" ? "transparent" : fillColor,
              }}
            />
            <span className="text-[10px] font-label uppercase">
              {fillColor === "transparent" ? "No Fill" : "Solid"}
            </span>
          </button>
        </div>
      )}

      {/* 3. Stroke Width Presets */}
      {isDrawOrLine && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 border-r border-foreground/20 shrink-0">
          {strokeWidthPresets.map((sw) => (
            <button
              key={sw.label}
              type="button"
              disabled={disabled}
              onClick={() => setStrokeWidth(sw.value)}
              title={`${sw.label} (${sw.value}px)`}
              className={`h-7 px-2 flex items-center gap-1.5 rounded-DEFAULT text-[11px] font-label transition-all shrink-0 ${
                strokeWidth === sw.value
                  ? "bg-foreground text-surface font-bold shadow-stamp-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className={`rounded-full bg-current ${sw.dotSize}`} />
              <span className="hidden sm:inline">{sw.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Stroke Style */}
      {isDrawOrLine && tool !== "Text" && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 border-r border-foreground/20 shrink-0">
          {[
            { id: "solid", label: "Solid", dash: "stroke-dasharray: none;" },
            { id: "dashed", label: "Dashed", dash: "stroke-dasharray: 4,4;" },
            { id: "dotted", label: "Dotted", dash: "stroke-dasharray: 1,3;" },
          ].map((style) => (
            <button
              key={style.id}
              type="button"
              disabled={disabled}
              onClick={() => setStrokeStyle(style.id)}
              title={style.label}
              className={`h-7 px-2 flex items-center justify-center rounded-DEFAULT text-[11px] font-label transition-all shrink-0 ${
                strokeStyle === style.id
                  ? "bg-foreground text-surface font-bold shadow-stamp-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <svg className="w-4 h-2.5 overflow-visible" viewBox="0 0 16 2">
                <line
                  x1="0"
                  y1="1"
                  x2="16"
                  y2="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={style.id === "dashed" ? "3,3" : style.id === "dotted" ? "1,2" : undefined}
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* 5. Viewport Controls & Grid Mode */}
      <div className="flex items-center gap-1 px-1.5 py-0.5 shrink-0">
        <button
          type="button"
          onClick={cycleGridStyle}
          title={`Grid: ${gridStyle} (click to toggle)`}
          className="h-7 px-2 flex items-center gap-1 text-[11px] font-label font-bold rounded-DEFAULT border border-foreground/40 bg-surface hover:bg-secondary text-foreground transition-colors shrink-0"
        >
          <Grid className="w-3 h-3 text-primary" />
          <span className="uppercase text-[9px]">{gridStyle}</span>
        </button>

        <button
          type="button"
          onClick={() => setSnapToGrid((prev) => !prev)}
          title={`Snap to Grid: ${snapToGrid ? "ON" : "OFF"}`}
          className={`h-7 px-2 flex items-center gap-1 text-[11px] font-label font-bold rounded-DEFAULT border transition-colors shrink-0 ${
            snapToGrid
              ? "border-foreground bg-primary text-white shadow-stamp-xs"
              : "border-foreground/40 bg-surface text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Magnet className="w-3 h-3" />
          <span className="uppercase text-[9px]">Snap</span>
        </button>

        {/* Zoom Out / Indicator / Zoom In */}
        <div className="flex items-center border border-foreground/40 rounded-DEFAULT bg-surface px-1 h-7">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            title="Reset Zoom (100%)"
            className="px-1.5 text-[10px] font-mono font-bold text-foreground hover:text-primary transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={onZoomFit}
          title="Fit Canvas"
          className="h-7 w-7 flex items-center justify-center rounded-DEFAULT border border-foreground/40 bg-surface hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onExport}
          title="Export Canvas to PNG"
          className="h-7 px-2 flex items-center gap-1 text-[10px] font-label font-bold uppercase rounded-DEFAULT border border-foreground bg-surface hover:bg-secondary text-foreground shadow-stamp-xs active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Download className="w-3 h-3 text-primary" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Hotkeys (?)"
          className="h-7 w-7 flex items-center justify-center rounded-DEFAULT border border-foreground/40 bg-surface hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
