"use client"

import type { ComponentProps } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Bolder stroke so back arrows read clearly across dashboard screens */
export const DASHBOARD_BACK_ICON_CLASS = "shrink-0 stroke-[2.5]"

export function DashboardBackIcon({ className }: { className?: string }) {
  return <ArrowLeft className={cn("h-4 w-4", DASHBOARD_BACK_ICON_CLASS, className)} />
}

export function DashboardBackButton({
  onClick,
  className,
  size = "default",
  variant = "ghost",
}: {
  onClick: () => void
  className?: string
  size?: "compact" | "default"
  variant?: ComponentProps<typeof Button>["variant"]
}) {
  const compact = size === "compact"
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-1.5 font-semibold",
        compact ? "h-6 px-1.5 text-[10px]" : "h-7 -ml-2 px-2 text-xs w-fit shrink-0",
        className
      )}
    >
      <ArrowLeft
        className={cn(
          DASHBOARD_BACK_ICON_CLASS,
          compact ? "h-3 w-3" : "h-3.5 w-3.5"
        )}
      />
      Back
    </Button>
  )
}

export function DashboardBackLink({
  href,
  className,
  variant = "ghost",
}: {
  href: string
  className?: string
  variant?: ComponentProps<typeof Button>["variant"]
}) {
  return (
    <Button variant={variant} size="sm" asChild className={cn("gap-1.5 font-semibold", className)}>
      <Link href={href} className="inline-flex items-center gap-1.5">
        <DashboardBackIcon />
        Back
      </Link>
    </Button>
  )
}
