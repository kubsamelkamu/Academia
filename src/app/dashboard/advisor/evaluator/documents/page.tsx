"use client"

import { AdvisorDocumentsPage } from "@/components/dashboard/advisor/documents-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

export default function AdvisorEvaluatorDocumentsRoutePage() {
  return (
    <AdvisorEvaluatorShell>
      <AdvisorDocumentsPage variant="evaluator" />
    </AdvisorEvaluatorShell>
  )
}
