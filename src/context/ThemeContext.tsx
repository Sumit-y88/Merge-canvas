"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (newTheme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const savedTheme = window.localStorage.getItem("mergecanvas-theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches
      ) {
        return "light";
      }
    } catch {
      // LocalStorage access may fail in restricted browser modes
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem("mergecanvas-theme", theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
