"use client"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  className?: string
}

export default function PageHeader({
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
