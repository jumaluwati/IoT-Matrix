"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options: Array<{ value: "light" | "dark" | "system"; icon: React.ReactNode; label: string }> = [
    { value: "light", icon: <Sun className="h-3.5 w-3.5" />, label: "Light" },
    { value: "system", icon: <Monitor className="h-3.5 w-3.5" />, label: "System" },
    { value: "dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Dark" }
  ];
  return (
    <div className="glass inline-flex items-center rounded-full p-1">
      {options.map((o) => (
        <button
          key={o.value}
          aria-label={o.label}
          onClick={() => setTheme(o.value)}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            theme === o.value
              ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
              : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
          )}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
