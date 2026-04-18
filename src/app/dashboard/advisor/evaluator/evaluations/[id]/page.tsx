"use client"

import { useParams } from "next/navigation"

import { AdvisorEvaluationDetailPage } from "@/components/dashboard/advisor/evaluation-detail-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

export default function AdvisorEvaluatorEvaluationDetailRoutePage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluationDetailPage
        evaluationId={id}
        evaluationsListHref="/dashboard/advisor/evaluator"
        evaluationsListLabel="Back to evaluator overview"
      />
    </AdvisorEvaluatorShell>
  )
}
