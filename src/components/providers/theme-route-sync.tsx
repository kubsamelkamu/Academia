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
    // Only force the dashboard theme preference on dashboard routes.
    // Marketing and auth pages respect the user's own next-themes preference.
    if (isDashboard && theme !== dashboardMode) {
      setTheme(dashboardMode)
    }
  }, [dashboardMode, pathname, setTheme, theme])

  return null
}
