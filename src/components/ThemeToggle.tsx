import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    try { setTheme(localStorage.getItem("mentor-theme") === "light" ? "light" : "dark"); } catch { /* Storage may be unavailable. */ }
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const toggle = () => setTheme((current) => {
    const next = current === "dark" ? "light" : "dark";
    try { localStorage.setItem("mentor-theme", next); } catch { /* Still switch without persistence. */ }
    return next;
  });
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
  return <Button variant="outline" size="icon" onClick={toggle} aria-label={label} title={label}>
    {theme === "dark" ? <Sun /> : <Moon />}
  </Button>;
}