"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Full-width evaluator workspace under the dashboard header (main uses p-0 for this route).
 */
export function AdvisorEvaluatorShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full max-w-none flex-col bg-background",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 flex-col px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-8 lg:py-7 xl:px-10 xl:py-8 2xl:px-12",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </div>
    </div>
  )
}
