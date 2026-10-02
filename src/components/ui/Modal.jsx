import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-lg",
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop: Warm paper wash */}
      <div
        className="fixed inset-0 bg-background/80 dark:bg-black/80 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container: Stitch Tactile Workshop pinned board */}
      <div
        className={cn(
          "relative w-full bg-surface text-foreground border-[2px] border-foreground rounded-DEFAULT shadow-stamp-xl overflow-hidden z-10 animate-scale-in",
          maxWidth,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Washi Tape */}
        <div className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 z-20 pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-DEFAULT border border-transparent hover:border-foreground/30 transition-all focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-2 text-left border-b border-foreground/15">
            {title && (
              <h2 className="font-headline text-lg sm:text-xl font-bold text-foreground tracking-tight pr-8">
                {title}
              </h2>
            )}
            {description && (
              <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3 border-t border-foreground/15 bg-secondary/50 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
