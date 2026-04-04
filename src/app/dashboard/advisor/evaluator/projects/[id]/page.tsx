"use client"

import { useParams } from "next/navigation"

import { AdvisorEvaluatorProjectDetailPage } from "@/components/dashboard/advisor/advisor-evaluator-project-detail-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

export default function AdvisorEvaluatorProjectDetailRoutePage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluatorProjectDetailPage projectId={id} />
    </AdvisorEvaluatorShell>
  )
}
