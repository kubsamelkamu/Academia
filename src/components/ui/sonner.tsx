"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

export function Toaster() {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      closeButton
      toastOptions={{
        classNames: {
          toast: "bg-background text-foreground border border-border",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
    />
  )
}
