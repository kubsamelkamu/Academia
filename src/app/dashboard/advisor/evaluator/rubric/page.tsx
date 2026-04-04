"use client"

import { AdvisorEvaluatorRubricPage } from "@/components/dashboard/advisor/advisor-evaluator-rubric-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

export default function AdvisorEvaluatorRubricRoutePage() {
  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluatorRubricPage />
    </AdvisorEvaluatorShell>
  )
}
