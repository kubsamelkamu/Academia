import * as React from "react"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value))
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const normalizedValue = clamp(value)

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-transform"
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      />
    </div>
  )
}

export { Progress, type ProgressProps }
