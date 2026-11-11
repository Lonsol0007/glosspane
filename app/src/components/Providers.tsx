"use client";
import { useEffect, type ReactNode } from "react";
import { usePrefs } from "@/lib/prefs";
import { ToastProvider } from "./ui";

export function Providers({ children }: { children: ReactNode }) {
  const { theme } = usePrefs();
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return <ToastProvider>{children}</ToastProvider>;
}
