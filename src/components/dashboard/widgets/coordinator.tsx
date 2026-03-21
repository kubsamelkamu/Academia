"use client"

import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSectionCard } from "@/components/dashboard/page-primitives"

function CoordinatorKpisWidget() {
  return (
    <DashboardSectionCard
      title="Coordinator KPIs Placeholder"
      description="Coordinator KPI widgets are temporarily disabled."
    >
      <p className="text-sm text-muted-foreground">
        Replace this with real KPI cards when coordinator dashboard implementation starts.
      </p>
    </DashboardSectionCard>
  )
}

function CoordinatorPriorityQueueWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Priority Queue Placeholder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coordinator priority queue is intentionally set to placeholder content.
        </p>
      </CardContent>
    </Card>
  )
}

function CoordinatorExecutionFocusWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Focus Placeholder</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Add coordinator execution focus cards later during full dashboard implementation.
        </p>
      </CardContent>
    </Card>
  )
}

function CoordinatorUpcomingDefensesWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Defenses Placeholder</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Upcoming defenses list is currently a placeholder for upcoming coordinator work.
        </p>
      </CardContent>
    </Card>
  )
}

export const CoordinatorWidgets = {
  "co.kpis": {
    meta: {
      id: "co.kpis",
      title: "KPIs",
      rolesAllowed: ["coordinator"],
      defaultSize: { w: 12, h: 3 },
      minSize: { w: 6, h: 3 },
    },
    component: CoordinatorKpisWidget,
  },
  "co.queue": {
    meta: {
      id: "co.queue",
      title: "Priority Queue",
      rolesAllowed: ["coordinator"],
      defaultSize: { w: 8, h: 6 },
      minSize: { w: 4, h: 4 },
    },
    component: CoordinatorPriorityQueueWidget,
  },
  "co.focus": {
    meta: {
      id: "co.focus",
      title: "Execution Focus",
      rolesAllowed: ["coordinator"],
      defaultSize: { w: 4, h: 6 },
      minSize: { w: 4, h: 4 },
    },
    component: CoordinatorExecutionFocusWidget,
  },
  "co.defenses": {
    meta: {
      id: "co.defenses",
      title: "Upcoming Defenses",
      rolesAllowed: ["coordinator"],
      defaultSize: { w: 12, h: 5 },
      minSize: { w: 6, h: 4 },
    },
    component: CoordinatorUpcomingDefensesWidget,
  },
} as const
