import { createContext, useContext, useEffect, useState } from "react";

// Color mode: "light", "dark" or "system" (follow the OS). Stored per
// browser; index.html applies it before the first paint.
const STORAGE_KEY = "gh-theme";
const ThemeContext = createContext({ mode: "system", resolved: "light", setMode: () => {} });

const readStored = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
};

const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readStored);
  const [prefersDark, setPrefersDark] = useState(systemDark);
  const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  // follow OS changes while in "system" mode
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setPrefersDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", resolved);
  }, [resolved]);

  const setMode = (next) => {
    setModeState(next);
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage blocked (private mode): the choice lasts for this visit
    }
  };

  return <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>;
}

// the hook lives next to its provider (same pattern as AuthContext); this
// only affects hot reload in development
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
