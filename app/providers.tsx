"use client";

import { useEffect } from "react";
import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";

function MobileGestureLock() {
  useEffect(() => {
    // Prevent iOS Safari page-level pinch gestures
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });

    // Prevent double-tap zooming on non-input UI elements
    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement | null;
        if (!target?.closest("input, textarea, select, button, a")) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", preventDoubleTap, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchend", preventDoubleTap);
    };
  }, []);

  return null;
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MobileGestureLock />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
