import { useState, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  statusColor?: string;
  shape?: "circle" | "square";
  ring?: boolean;
}

const sizeClasses: Record<string, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-xs font-bold",
  md: "w-9 h-9 text-sm font-bold",
  lg: "w-12 h-12 text-base font-bold",
  xl: "w-16 h-16 text-2xl font-bold font-headline",
};

const statusSizeClasses: Record<string, string> = {
  xs: "w-2 h-2 -bottom-0.5 -right-0.5 border-[1px]",
  sm: "w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-[1.5px]",
  md: "w-3 h-3 bottom-0 right-0 border-2",
  lg: "w-3.5 h-3.5 bottom-0.5 right-0.5 border-2",
  xl: "w-4 h-4 bottom-1 right-1 border-2",
};

const HARMONIOUS_PALETTE = [
  "#D85A38", // Terracotta
  "#2563EB", // Cobalt
  "#2E7D32", // Sage
  "#D97706", // Amber
  "#E11D48", // Coral
  "#0891B2", // Cyan
  "#7C3AED", // Violet
  "#4F46E5", // Indigo
];

function getInitials(name = "") {
  if (!name || typeof name !== "string") return "MC";
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  if (!cleaned) return "MC";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function getColorForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return HARMONIOUS_PALETTE[Math.abs(hash) % HARMONIOUS_PALETTE.length];
}

function getContrastTextColor(hexColor?: string | null): string {
  if (!hexColor || !hexColor.startsWith("#") || hexColor.length < 7) {
    return "#FFFFFF";
  }
  try {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    // Standard relative luminance calculation
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 155 ? "#1C1A17" : "#FFFFFF";
  } catch {
    return "#FFFFFF";
  }
}

export const Avatar = ({
  src,
  name = "User",
  color,
  size = "md",
  status,
  statusColor,
  shape = "circle",
  ring = true,
  className,
  style,
  ...props
}: AvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const bgColor = color || getColorForName(name);
  const textColor = getContrastTextColor(bgColor);

  const isCircle = shape === "circle";
  const shapeClass = isCircle ? "rounded-full" : "rounded-DEFAULT";

  const hasValidImage = Boolean(src) && !imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 select-none group",
        className
      )}
      style={style}
      {...props}
    >
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden transition-all duration-150",
          sizeClasses[size] || sizeClasses.md,
          shapeClass,
          ring && "border border-foreground/80 shadow-stamp-xs",
          hasValidImage ? "bg-surface" : ""
        )}
        style={!hasValidImage ? { backgroundColor: bgColor, color: textColor } : undefined}
      >
        {hasValidImage ? (
          <img
            src={src as string}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-label tracking-wider select-none font-bold uppercase leading-none drop-shadow-xs">
            {initials}
          </span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute z-10 shrink-0 rounded-full border-surface transition-transform",
            statusSizeClasses[size] || statusSizeClasses.md,
            status === "online" && "bg-emerald-500",
            status === "offline" && "bg-stone-400",
            status === "away" && "bg-amber-400",
            status === "busy" && "bg-rose-500"
          )}
          style={statusColor ? { backgroundColor: statusColor } : undefined}
          title={`Status: ${status}`}
        >
          {status === "online" && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75 pointer-events-none" />
          )}
        </span>
      )}
    </div>
  );
};

export default Avatar;
