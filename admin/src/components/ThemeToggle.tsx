import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("admin_theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("admin_theme", theme);
  }, [theme]);

  return (
    <button className="theme-toggle-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
      {theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre"}
    </button>
  );
}
