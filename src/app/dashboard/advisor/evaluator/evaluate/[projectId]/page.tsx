"use client"

import { useParams, useSearchParams } from "next/navigation"

import { AdvisorEvaluatorEvaluatePage } from "@/components/dashboard/advisor/advisor-evaluator-evaluate-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"
import {
  parseAdvisorEvaluatorStageParam,
  type AdvisorEvaluatorStage,
} from "@/components/dashboard/advisor/advisor-evaluator-stage-menu"

export default function AdvisorEvaluatorEvaluateRoutePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = typeof params.projectId === "string" ? params.projectId : ""
  const stageParam = searchParams.get("stage")
  const parsed = parseAdvisorEvaluatorStageParam(stageParam)
  /** Missing or legacy ?stage= values must still load criteria + detail (defaults align with Capstone I pending queue). */
  const stage: AdvisorEvaluatorStage = parsed ?? "capstone-i"

  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluatorEvaluatePage projectId={projectId} stage={stage} />
    </AdvisorEvaluatorShell>
  )
}
