import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";

export const ThemeToggle = ({ className, showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center p-2 rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-transparent hover:border-border/50 active:scale-95",
        showLabel && "px-3 gap-2",
        className
      )}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={cn(
            "w-5 h-5 transition-all duration-300 transform absolute",
            theme === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-primary"
          )}
        />
        <Moon
          className={cn(
            "w-5 h-5 transition-all duration-300 transform absolute",
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100 text-primary"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium capitalize select-none">
          {theme} Mode
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
