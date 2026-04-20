"use client"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { GradesReportsPanel } from "@/components/dashboard/reports/grades-reports-panel"

export default function DepartmentHeadReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Reports & Analytics"
        description="Department-head view for grade review analytics, project and student drilldowns, and filtered report exports."
        badge="Department Head"
      />

      <GradesReportsPanel roleLabel="Department head" variant="department-head" />
    </div>
  )
}