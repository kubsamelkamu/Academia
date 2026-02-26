"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useThemeStore } from "@/store/theme-store"

export function ThemeRouteSync() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const dashboardMode = useThemeStore((s) => s.mode)

  useEffect(() => {
    const isDashboard = pathname?.startsWith("/dashboard") ?? false
    const desiredTheme = isDashboard ? dashboardMode : "light"

    if (theme !== desiredTheme) {
      setTheme(desiredTheme)
    }
  }, [dashboardMode, pathname, setTheme, theme])

  return null
}
