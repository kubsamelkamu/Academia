"use client"

import { useParams } from "next/navigation"

import { AdvisorEvaluatorEvaluatePage } from "@/components/dashboard/advisor/advisor-evaluator-evaluate-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

export default function AdvisorEvaluatorEvaluateRoutePage() {
  const params = useParams()
  const projectId = typeof params.projectId === "string" ? params.projectId : ""

  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluatorEvaluatePage projectId={projectId} />
    </AdvisorEvaluatorShell>
  )
}
