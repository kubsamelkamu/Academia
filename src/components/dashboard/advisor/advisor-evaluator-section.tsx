"use client"

import { AdvisorEvaluatorDashboard } from "@/components/dashboard/advisor/advisor-evaluator-dashboard"
import { AdvisorEvaluatorPendingPage } from "@/components/dashboard/advisor/advisor-evaluator-pending-page"
import { AdvisorEvaluatorScheduledPage } from "@/components/dashboard/advisor/advisor-evaluator-scheduled-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

import { type AdvisorEvaluatorView } from "./advisor-evaluator-shared"

export type { AdvisorEvaluatorView } from "./advisor-evaluator-shared"

export function AdvisorEvaluatorSectionPage({ view }: { view: AdvisorEvaluatorView }) {
  if (view === "dashboard") {
    return (
      <AdvisorEvaluatorShell>
        <AdvisorEvaluatorDashboard />
      </AdvisorEvaluatorShell>
    )
  }

  if (view === "pending") {
    return (
      <AdvisorEvaluatorShell>
        <AdvisorEvaluatorPendingPage />
      </AdvisorEvaluatorShell>
    )
  }

  if (view === "scheduled") {
    return (
      <AdvisorEvaluatorShell>
        <AdvisorEvaluatorScheduledPage />
      </AdvisorEvaluatorShell>
    )
  }

  const _exhaustive: never = view
  return _exhaustive
}
