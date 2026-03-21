import { DashboardSectionCard } from "@/components/dashboard/page-primitives"

type CoordinatorPlaceholderPageProps = {
  title: string
  description: string
}

function CoordinatorPlaceholderPage({ title, description }: CoordinatorPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <DashboardSectionCard
        title="Placeholder"
        description="This section is intentionally left as a placeholder for upcoming coordinator implementation."
      >
        <p className="text-sm text-muted-foreground">
          Add the actual coordinator workflows, tables, and actions in a future iteration.
        </p>
      </DashboardSectionCard>
    </div>
  )
}

export function CoordinatorProjectsPlaceholderPage() {
  return (
    <CoordinatorPlaceholderPage
      title="Coordinator Projects"
      description="Placeholder page for coordinator project management."
    />
  )
}

export function CoordinatorStudentsPlaceholderPage() {
  return (
    <CoordinatorPlaceholderPage
      title="Coordinator Students"
      description="Placeholder page for coordinator student management."
    />
  )
}

export function CoordinatorAdvisorsPlaceholderPage() {
  return (
    <CoordinatorPlaceholderPage
      title="Coordinator Advisors"
      description="Placeholder page for coordinator advisor management."
    />
  )
}

export function CoordinatorDefensesPlaceholderPage() {
  return (
    <CoordinatorPlaceholderPage
      title="Coordinator Defenses"
      description="Placeholder page for coordinator defense scheduling and tracking."
    />
  )
}

export function CoordinatorEvaluationsPlaceholderPage() {
  return (
    <CoordinatorPlaceholderPage
      title="Coordinator Evaluations"
      description="Placeholder page for coordinator evaluation workflows."
    />
  )
}

export function CoordinatorReportsPlaceholderPage() {
  return (
    <CoordinatorPlaceholderPage
      title="Coordinator Reports"
      description="Placeholder page for coordinator reporting and exports."
    />
  )
}
