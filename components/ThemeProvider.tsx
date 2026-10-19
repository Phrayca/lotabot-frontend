"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Mode = "auto" | "light" | "dark";

const STORAGE_KEY = "lotabot_theme";

const ThemeContext = createContext<{
  mode: Mode;
  resolvedTheme: "light" | "dark";
  setMode: (m: Mode) => void;
}>({
  mode: "auto",
  resolvedTheme: "light",
  setMode: () => {},
});

function applyMode(mode: Mode) {
  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // "auto" par defaut : suit la preference du systeme (voir le script dans layout.tsx, qui
  // applique deja la preference enregistree avant le premier rendu pour eviter un flash).
  const [mode, setModeState] = useState<Mode>("auto");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "auto") {
      setModeState(stored);
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function setMode(next: Mode) {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // stockage indisponible (navigation privee, etc.) : le choix ne persiste pas, tant pis
    }
    applyMode(next);
  }

  const resolvedTheme: "light" | "dark" = mode === "auto" ? (systemDark ? "dark" : "light") : mode;

  return <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
