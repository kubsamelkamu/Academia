"use client"

import * as React from "react"
import Link from "next/link"
import { type UserRole } from "@/config/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardPageHeader, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import { getWidgetsForRole, WIDGET_REGISTRY } from "@/lib/dashboard/widget-registry"
import { getDefaultDashboardLayout } from "@/lib/dashboard/default-layouts"
import { getDashboardLayoutKey } from "@/lib/dashboard/layout-key"
import { useAuthStore } from "@/store/auth-store"
import { useDashboardLayoutStore } from "@/store/dashboard-layout-store"
import { type DashboardLayoutState, type GridLayouts } from "@/types/dashboard-layout"
import { LayoutDashboard, RotateCcw, Save, Settings, X } from "lucide-react"
import { Responsive, useContainerWidth, verticalCompactor, type Layout } from "react-grid-layout"

const GRID_BREAKPOINTS = { lg: 1024, md: 768, sm: 640, xs: 0 }
const GRID_COLS = { lg: 12, md: 10, sm: 6, xs: 4 }

function roleHeader(role: UserRole): { title: string; description: string; badge?: string } {
  switch (role) {
    case "department_head":
      return {
        title: "Department Head",
        description: "",
      }
    case "coordinator":
      return {
        title: "Coordinator Dashboard",
        description: "Manage projects, advisor assignments, and defense readiness in your department.",
      }
    case "advisor":
      return {
        title: "Advisor Dashboard",
        description: "Oversee assigned projects, student progress, and pending evaluation duties.",
      }
    case "student":
      return {
        title: "Student Dashboard",
        description: "Track your project progress, submissions, and upcoming defense milestones.",
      }
    case "department_committee":
      return {
        title: "Department Committee Dashboard",
        description: "Review project title submissions and decide approval, rejection, or re-review quickly.",
        badge: "Department Committee",
      }
    default: {
      const exhaustive: never = role
      return exhaustive
    }
  }
}

type RglLayouts = Partial<Record<string, Layout>>

function toLayouts(layoutState: DashboardLayoutState): RglLayouts {
  return layoutState.layouts as unknown as RglLayouts
}

function toGridLayouts(layouts: RglLayouts): GridLayouts {
  const next: Partial<GridLayouts> = {}
  for (const key of Object.keys(GRID_COLS) as Array<keyof GridLayouts>) {
    next[key] = (layouts[key] ?? []) as unknown as GridLayouts[keyof GridLayouts]
  }
  return next as GridLayouts
}

export function CustomizableDashboard(props: { role: UserRole; userId: string; userName?: string }) {
  const { containerRef, width, mounted } = useContainerWidth({ measureBeforeMount: true })

  const tenantDomain = useAuthStore((s) => s.tenantDomain)
  const departmentName = useAuthStore((s) => s.user?.departmentName ?? s.user?.department?.name ?? null)
  const key = React.useMemo(
    () =>
      getDashboardLayoutKey({
        tenantDomain,
        userId: props.userId,
        role: props.role,
      }),
    [tenantDomain, props.userId, props.role]
  )

  const layoutFromStore = useDashboardLayoutStore((s) => s.layoutsByKey[key])
  const saveLayout = useDashboardLayoutStore((s) => s.saveLayout)
  const resetLayout = useDashboardLayoutStore((s) => s.resetLayout)
  const getOrCreateLayout = useDashboardLayoutStore((s) => s.getOrCreateLayout)

  React.useEffect(() => {
    if (!layoutFromStore) {
      getOrCreateLayout(key, props.role)
    }
  }, [layoutFromStore, getOrCreateLayout, key, props.role])

  const baseLayout = layoutFromStore ?? getDefaultDashboardLayout(props.role)

  const [isEditing, setIsEditing] = React.useState(false)
  const [draftEnabled, setDraftEnabled] = React.useState<string[]>(baseLayout.enabledWidgetIds)
  const [draftLayouts, setDraftLayouts] = React.useState<RglLayouts>(() => toLayouts(baseLayout))

  React.useEffect(() => {
    // When store updates (e.g., switching roles), keep draft in sync unless editing.
    if (!isEditing) {
      setDraftEnabled(baseLayout.enabledWidgetIds)
      setDraftLayouts(toLayouts(baseLayout))
    }
  }, [baseLayout, isEditing])

  const widgetsForRole = React.useMemo(() => getWidgetsForRole(props.role), [props.role])
  const widgetIdsForRole = React.useMemo(() => widgetsForRole.map((w) => w.meta.id), [widgetsForRole])

  const enabledWidgetIds = isEditing ? draftEnabled : baseLayout.enabledWidgetIds
  const activeLayouts = isEditing ? draftLayouts : toLayouts(baseLayout)

  const actions = (
    <>
      {isEditing ? (
        <>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false)
              setDraftEnabled(baseLayout.enabledWidgetIds)
              setDraftLayouts(toLayouts(baseLayout))
            }}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetLayout(key, props.role)
              setIsEditing(false)
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={() => {
              saveLayout(key, {
                ...baseLayout,
                enabledWidgetIds: draftEnabled,
                layouts: toGridLayouts(draftLayouts),
              })
              setIsEditing(false)
            }}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(true)
              setDraftEnabled(baseLayout.enabledWidgetIds)
              setDraftLayouts(toLayouts(baseLayout))
            }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Edit layout
          </Button>
        </>
      )}
    </>
  )

  const header = roleHeader(props.role)

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={header.title}
        description={header.description}
        badge={header.badge}
        actions={actions}
      />

      {props.role === "department_head" ? (
        <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 p-4 text-white">
          <p className="text-lg font-semibold">
            Welcome back{props.userName ? `, ${props.userName}` : ""}
          </p>
          <p className="text-sm opacity-90">
            {departmentName
              ? `Here’s an at-a-glance view of ${departmentName}.`
              : "Here’s an at-a-glance view of your department."}
          </p>
        </div>
      ) : null}

      {isEditing ? (
        <DashboardSectionCard
          title="Dashboard widgets"
          description="Toggle widgets, then drag + resize cards."
        >
          <div className="flex flex-wrap gap-2">
            {widgetIdsForRole.map((id) => {
              const enabled = draftEnabled.includes(id)
              const title = WIDGET_REGISTRY[id]?.meta.title ?? id

              return (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={enabled ? "secondary" : "outline"}
                  onClick={() => {
                    setDraftEnabled((current) =>
                      current.includes(id)
                        ? current.filter((x) => x !== id)
                        : [...current, id]
                    )
                  }}
                >
                  {title}
                  <Badge className="ml-2" variant={enabled ? "secondary" : "outline"}>
                    {enabled ? "Shown" : "Hidden"}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </DashboardSectionCard>
      ) : null}

      <div ref={containerRef}>
        {mounted ? (
          <Responsive
            width={width}
            className="layout"
            breakpoints={GRID_BREAKPOINTS}
            cols={GRID_COLS}
            layouts={activeLayouts}
            rowHeight={44}
            margin={[16, 16] as const}
            containerPadding={[0, 0] as const}
            compactor={verticalCompactor}
            dragConfig={{ enabled: isEditing, bounded: false, threshold: 3, handle: ".academia-drag-handle" }}
            resizeConfig={{ enabled: isEditing, handles: ["se", "s", "e"] }}
            onLayoutChange={(_: Layout, allLayouts: RglLayouts) => {
              if (!isEditing) return
              setDraftLayouts(allLayouts)
            }}
          >
            {enabledWidgetIds
              .filter((id) => widgetIdsForRole.includes(id))
              .map((id) => {
                const item = WIDGET_REGISTRY[id]
                if (!item) return null

                const Widget = item.component

                return (
                  <div key={id} className="h-full">
                    <div className="academia-drag-handle mb-2 flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                      <p className="text-sm font-medium">{item.meta.title}</p>
                      {isEditing ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDraftEnabled((current) => current.filter((x) => x !== id))}
                        >
                          Hide
                        </Button>
                      ) : null}
                    </div>

                    <Widget settings={baseLayout.widgetSettings[id] as Record<string, unknown> | undefined} />
                  </div>
                )
              })}
          </Responsive>
        ) : null}
      </div>
    </div>
  )
}
