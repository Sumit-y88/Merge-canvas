import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-label font-bold uppercase tracking-wider text-foreground/90 select-none flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            disabled={disabled}
            className={cn(
              "w-full h-10 px-3.5 text-sm bg-surface border-[1.5px] border-foreground rounded-DEFAULT text-foreground placeholder:text-muted-foreground/60 transition-all focus:outline-none focus:border-primary focus:shadow-stamp-terracotta disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-9",
              (rightIcon || isPassword) && "pr-9",
              error && "border-destructive focus:shadow-[2px_2px_0px_#ba1a1a]",
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center justify-center">
                {rightIcon}
              </div>
            )
          )}
        </div>
        {error ? (
          <p className="text-xs font-label font-medium text-destructive animate-fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
