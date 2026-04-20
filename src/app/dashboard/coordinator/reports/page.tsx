"use client"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { GradesReportsPanel } from "@/components/dashboard/reports/grades-reports-panel"

export default function CoordinatorReportsPage() {
  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <DashboardPageHeader
        title="Reports & Analytics"
        description="Coordinator view for stage overview analytics, project drilldown, student drilldown, and filtered report downloads."
        badge="Coordinator"
      />

      <GradesReportsPanel roleLabel="Coordinator" variant="coordinator" />
    </div>
  )
}