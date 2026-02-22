"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { themes } from "@/lib/themes"
import { useThemeStore } from "@/store/theme-store"

function resolveMode(inputMode: string | undefined): "light" | "dark" {
  if (inputMode === "dark" || inputMode === "light") {
    return inputMode
  }

  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function ThemeCustomizer() {
  const { theme: mode } = useTheme()
  const { color, radiusRem, font, scaling } = useThemeStore()

  React.useEffect(() => {
    const root = document.documentElement
    const themeConfig = themes.find((t) => t.name === color)
    if (!themeConfig) return

    // Radius & scaling
    root.style.setProperty("--radius", `${radiusRem}rem`)
    root.style.setProperty("font-size", `${Math.max(0.75, Math.min(1.25, scaling)) * 100}%`)

    // Font
    const fontValue =
      font === "inter"
        ? "var(--font-inter)"
        : font === "manrope"
          ? "var(--font-manrope)"
          : font === "playfair"
            ? "var(--font-playfair)"
            : "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"

    root.style.setProperty("--font-sans", fontValue)

    // Colors by mode
    const resolved = resolveMode(mode)
    const vars = resolved === "dark" ? themeConfig.cssVars.dark : themeConfig.cssVars.light

    root.style.setProperty("--primary", `oklch(${vars.primary})`)
    root.style.setProperty("--ring", `oklch(${vars.ring})`)

    // Keep sidebar accents aligned with the selected theme color.
    // (The sidebar uses its own token set: --sidebar-primary, --sidebar-ring, ...)
    root.style.setProperty("--sidebar-primary", `oklch(${vars.primary})`)
    root.style.setProperty("--sidebar-ring", `oklch(${vars.ring})`)
  }, [color, radiusRem, font, scaling, mode])

  return null
}
