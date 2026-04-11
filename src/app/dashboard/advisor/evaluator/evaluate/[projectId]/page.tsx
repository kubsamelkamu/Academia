"use client"

import { useParams, useSearchParams } from "next/navigation"

import { AdvisorEvaluatorEvaluatePage } from "@/components/dashboard/advisor/advisor-evaluator-evaluate-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"
import type { AdvisorEvaluatorStage } from "@/components/dashboard/advisor/advisor-evaluator-stage-menu"

export default function AdvisorEvaluatorEvaluateRoutePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = typeof params.projectId === "string" ? params.projectId : ""
  const stageParam = searchParams.get("stage")
  const stage = stageParam === "capstone-i" || stageParam === "capstone-ii" ? (stageParam as AdvisorEvaluatorStage) : null

  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluatorEvaluatePage projectId={projectId} stage={stage} />
    </AdvisorEvaluatorShell>
  )
}
