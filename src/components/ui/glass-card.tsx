"use client"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { type ComponentProps } from "react"

type GlassCardProps = ComponentProps<typeof Card>

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <Card 
      className={cn(
        "group overflow-hidden relative",
        "bg-white/80 dark:bg-black/20",
        "backdrop-blur-md",
        "border border-white/20 dark:border-black/20",
        "shadow-2xl ring-1 ring-white/10 dark:ring-black/10",
        "hover:shadow-3xl hover:-translate-y-1 hover:scale-[1.02]",
        "hover:ring-primary/30 dark:hover:ring-primary/30",
        "transition-all duration-500 ease-out",
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  )
}
