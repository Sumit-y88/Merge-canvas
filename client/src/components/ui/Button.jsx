import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const variantClasses = {
  primary:
    "bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm border border-primary/20 active:scale-[0.98]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border active:scale-[0.98]",
  outline:
    "border border-border bg-background/50 hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
  ghost:
    "hover:bg-secondary/80 hover:text-foreground text-muted-foreground active:scale-[0.98]",
  glass:
    "glass-card text-foreground hover:bg-accent/60 active:scale-[0.98]",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm active:scale-[0.98]",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2.5",
  icon: "h-10 w-10 p-0 rounded-xl justify-center items-center",
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
          "inline-flex flex-nowrap items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
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
