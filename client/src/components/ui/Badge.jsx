import { cn } from "../../lib/utils";

const variantClasses = {
  default: "bg-primary/15 text-primary border-primary/20",
  secondary: "bg-secondary text-secondary-foreground border-border",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
  outline: "bg-transparent text-foreground border-border",
};

const dotColorClasses = {
  default: "bg-primary",
  secondary: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  outline: "bg-foreground",
};

export const Badge = ({
  children,
  variant = "default",
  dot = false,
  pulse = false,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors select-none",
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotColorClasses[variant] || dotColorClasses.default
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColorClasses[variant] || dotColorClasses.default
            )}
          />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
