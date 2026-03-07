import { DashboardEmptyState, DashboardPageHeader, DashboardSectionCard } from "@/components/dashboard/page-primitives"

export default function FacultyPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Faculty"
        description="This page is a placeholder for now."
      />

      <DashboardSectionCard title="Coming soon" description="Faculty tools will live here.">
        <DashboardEmptyState
          title="Under construction"
          description="We’re preparing the Faculty dashboard. Check back soon."
        />
      </DashboardSectionCard>
    </div>
  )
}
