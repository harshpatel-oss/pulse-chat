// src/context/ThemeContext.jsx
//
// FIX: the previous implementation added a `.light` class for light mode and
// treated "no class" as dark — but tailwind.config.js declares
// `darkMode: "class"`, which means Tailwind only activates `dark:` variants
// when a `dark` class is present on a root ancestor. The two conventions
// directly contradicted each other, which is why the app was visually stuck
// in dark mode regardless of what the toggle did: nothing in the stylesheet
// was actually keyed off the `.light` class except the hand-written CSS
// overrides in index.css, and any component using Tailwind's `dark:` prefix
// would never have switched at all.
//
// This rewrite uses the standard, unambiguous convention: a `dark` class on
// <html> means dark mode; its absence means light mode. Every component
// that previously relied on bare semantic tokens (bg-base, text-ink, etc.)
// continues to work because those tokens are still defined for both states
// in index.css — only the class name flipped to match Tailwind's own
// expectation.
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const ThemeContext = createContext(null);
const THEME_KEY = "pulse-theme";

const applyThemeClass = (theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
};

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Apply on every mount/change, not just once — guards against any future
  // code path that creates the provider after the class was already reset.
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Keep in sync with OS-level changes if the user hasn't set an explicit
  // preference yet (no localStorage entry).
  useEffect(() => {
    if (localStorage.getItem(THEME_KEY)) return; // explicit choice wins
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setThemeState(e.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next) => {
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
