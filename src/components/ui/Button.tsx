import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const variantClasses = {
  primary:
    "bg-primary hover:bg-primary-hover text-primary-foreground border-[1.5px] border-foreground shadow-stamp active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none font-label font-bold",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-[1.5px] border-foreground shadow-stamp active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none font-label font-medium",
  outline:
    "border-[1.5px] border-foreground bg-surface hover:bg-secondary/60 text-foreground shadow-stamp active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none font-label font-medium",
  ghost:
    "hover:bg-secondary/60 hover:text-foreground text-muted-foreground font-label font-medium border border-transparent hover:border-foreground/30",
  glass:
    "border-[1.5px] border-foreground bg-surface/90 text-foreground shadow-stamp hover:bg-surface active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-[1.5px] border-foreground shadow-stamp active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none font-label font-bold",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs rounded-DEFAULT gap-1.5",
  md: "h-10 px-4 text-xs rounded-DEFAULT gap-2",
  lg: "h-12 px-6 text-sm rounded-DEFAULT gap-2.5",
  icon: "h-10 w-10 p-0 rounded-DEFAULT justify-center items-center",
};

export const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex flex-nowrap items-center justify-center whitespace-nowrap transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          variantClasses[variant] || variantClasses.primary,
          sizeClasses[size] || sizeClasses.md,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
