import { type UserRole } from "@/config/navigation"

export type DashboardBreakpoint = "lg" | "md" | "sm" | "xs"

export interface GridItemLayout {
  i: string
  x: number
  y: number
  w: number
  h: number
  static?: boolean
}

export type GridLayouts = Record<DashboardBreakpoint, GridItemLayout[]>

export interface DashboardLayoutState {
  version: 1
  role: UserRole
  enabledWidgetIds: string[]
  layouts: GridLayouts
  widgetSettings: Record<string, unknown>
  updatedAt: string
}
