"use client"

import { Badge } from "@/components/ui/badge"

type StatusVariant = "default" | "secondary" | "destructive" | "outline"

export type SimpleStatus = string

interface StatusBadgeProps {
  status: SimpleStatus
}

function getStatusVariant(status: string): StatusVariant {
  const normalized = status.toLowerCase()

  if (["active", "approved", "completed", "online"].includes(normalized)) {
    return "default"
  }

  if (["pending", "invited", "provisional", "in-progress", "draft"].includes(normalized)) {
    return "secondary"
  }

  if (["blocked", "rejected", "inactive", "disabled"].includes(normalized)) {
    return "destructive"
  }

  return "outline"
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const display = status.replace(/[_-]/g, " ")

  return (
    <Badge variant={getStatusVariant(status)} className="capitalize">
      {display}
    </Badge>
  )
}

