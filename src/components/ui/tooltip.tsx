import * as React from "react"

export type TooltipProviderProps = {
  children: React.ReactNode
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

export type TooltipProps = React.ComponentProps<"div">

export function Tooltip({ children, ...props }: TooltipProps) {
  return (
    <div {...props}>
      {children}
    </div>
  )
}

export type TooltipTriggerProps = React.ComponentProps<"button">

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  function TooltipTrigger({ children, ...props }, ref) {
    return (
      <button type="button" ref={ref} {...props}>
        {children}
      </button>
    )
  },
)

export type TooltipContentProps = React.ComponentProps<"div">

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent({ children, ...props }, ref) {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  },
)

