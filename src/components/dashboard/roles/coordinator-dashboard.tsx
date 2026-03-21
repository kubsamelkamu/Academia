"use client"

import { DashboardSectionCard } from "@/components/dashboard/page-primitives"

export function CoordinatorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coordinator Dashboard</h1>
        <p className="text-muted-foreground">
          Placeholder version. Full coordinator implementation will be added later.
        </p>
      </div>

      <DashboardSectionCard
        title="Coordinator Dashboard Placeholder"
        description="This dashboard is intentionally simplified until the new coordinator experience is implemented."
      >
        <p className="text-sm text-muted-foreground">
          Build coordinator KPIs, queues, and defense tracking here when ready.
        </p>
      </DashboardSectionCard>
    </div>
  )
}
