"use client"

import { AdvisorEvaluatorProjectsListPage } from "@/components/dashboard/advisor/advisor-evaluator-projects-list-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

export default function AdvisorEvaluatorProjectsRoutePage() {
  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluatorProjectsListPage />
    </AdvisorEvaluatorShell>
  )
}
