"use client"

import { useParams } from "next/navigation"

import { AdvisorEvaluatorSessionDetailPage } from "@/components/dashboard/advisor/advisor-evaluator-session-detail-page"
import { AdvisorEvaluatorShell } from "@/components/dashboard/advisor/advisor-evaluator-shell"

export default function AdvisorEvaluatorSessionDetailRoute() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  return (
    <AdvisorEvaluatorShell>
      <AdvisorEvaluatorSessionDetailPage sessionId={id} />
    </AdvisorEvaluatorShell>
  )
}
