"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/admin-toss";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.dataset.theme === "dark") return "dark";
  return "light";
}

export function AdminThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function applyTheme(next: Theme) {
    const html = document.documentElement;
    html.dataset.theme = next;
    html.classList.toggle("dark", next === "dark");
    html.classList.toggle("light", next === "light");
    try {
      window.localStorage.setItem("theme-preference", next);
    } catch {
      // Local storage may be unavailable in private contexts.
    }
    setTheme(next);
  }

  return (
    <div data-skin="toss" className="ts-segment" role="group" aria-label="테마 전환">
      <button
        type="button"
        className="ts-segment__btn"
        data-active={theme === "light" ? "true" : "false"}
        onClick={() => applyTheme("light")}
        aria-pressed={theme === "light"}
      >
        <Icon name="sun" size={16} />
        라이트
      </button>
      <button
        type="button"
        className="ts-segment__btn"
        data-active={theme === "dark" ? "true" : "false"}
        onClick={() => applyTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        <Icon name="moon" size={16} />
        다크
      </button>
    </div>
  );
}
