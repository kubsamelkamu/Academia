import { type UserRole } from "@/config/navigation"
import type React from "react"
import { DepartmentHeadWidgets } from "@/components/dashboard/widgets/department-head"
import { CoordinatorWidgets } from "@/components/dashboard/widgets/coordinator"
import { AdvisorWidgets } from "@/components/dashboard/widgets/advisor"
import { StudentWidgets } from "@/components/dashboard/widgets/student"
import { DepartmentCommitteeWidgets } from "@/components/dashboard/widgets/department-committee"

export interface WidgetMeta {
  id: string
  title: string
  rolesAllowed: readonly UserRole[]
  defaultSize?: Readonly<{ w: number; h: number }>
  minSize?: Readonly<{ w: number; h: number }>
}

export interface WidgetComponentProps {
  settings?: Record<string, unknown>
}

export type WidgetRegistryItem = {
  meta: WidgetMeta
  component: React.ComponentType<WidgetComponentProps>
}

export const WIDGET_REGISTRY: Record<string, WidgetRegistryItem> = {
  ...DepartmentHeadWidgets,
  ...CoordinatorWidgets,
  ...AdvisorWidgets,
  ...StudentWidgets,
  ...DepartmentCommitteeWidgets,
}

export function getWidgetsForRole(role: UserRole): WidgetRegistryItem[] {
  return Object.values(WIDGET_REGISTRY).filter((item) => item.meta.rolesAllowed.includes(role))
}
