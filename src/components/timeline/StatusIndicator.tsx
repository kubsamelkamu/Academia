"use client"

import { CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: 'on_track' | 'at_risk' | 'overdue' | 'completed' | 'pending'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusIndicator({ status, size = 'md', className }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const getIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={cn('text-success', sizeClasses[size])} />
      case 'on_track':
        return <CheckCircle className={cn('text-success', sizeClasses[size])} />
      case 'at_risk':
        return <AlertTriangle className={cn('text-warning', sizeClasses[size])} />
      case 'overdue':
        return <XCircle className={cn('text-destructive', sizeClasses[size])} />
      case 'pending':
        return <Clock className={cn('text-muted-foreground', sizeClasses[size])} />
      default:
        return <Clock className={cn('text-muted-foreground', sizeClasses[size])} />
    }
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {getIcon()}
    </div>
  )
}