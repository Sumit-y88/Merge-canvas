import { useState } from "react";
import { cn } from "../../lib/utils";

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-xs font-semibold",
  lg: "w-11 h-11 text-sm font-semibold",
  xl: "w-14 h-14 text-base font-bold",
};

const statusSizeClasses = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
};

const statusClasses = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  away: "bg-warning",
  busy: "bg-destructive",
};

const gradients = [
  "from-primary to-accent",
  "from-accent to-primary",
  "from-destructive to-primary",
  "from-warning to-primary",
  "from-primary to-success",
  "from-accent to-success",
];

function getInitials(name = "") {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getGradientIndex(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % gradients.length;
}

export const Avatar = ({
  src,
  name = "User",
  size = "md",
  status,
  statusColor,
  className,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const gradient = gradients[getGradientIndex(name)];

  return (
    <div className={cn("relative inline-flex shrink-0 select-none", className)} {...props}>
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden rounded-full border border-foreground/10 text-primary-foreground shadow-sm transition-shadow duration-200",
          sizeClasses[size] || sizeClasses.md,
          !src || imageError ? `bg-gradient-to-br ${gradient}` : "bg-secondary"
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="select-none leading-none tracking-tight">{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 z-10 shrink-0 rounded-full border-2 border-card shadow-sm",
            statusSizeClasses[size] || statusSizeClasses.md,
            statusClasses[status] || statusClasses.offline
          )}
          style={statusColor ? { backgroundColor: statusColor } : undefined}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
