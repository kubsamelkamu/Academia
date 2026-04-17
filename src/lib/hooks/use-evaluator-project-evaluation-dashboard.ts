"use client"

import { useQuery } from "@tanstack/react-query"

import {
  getEvaluatorProjectEvaluationDashboard,
  type AdvisorEvaluationDashboardStage,
  type EvaluatorProjectEvaluationDashboard,
} from "@/lib/api/advisor"

export const evaluatorProjectEvaluationDashboardKeys = {
  root: ["advisor", "evaluator-project-evaluation-dashboard"] as const,
  stage: (stage: AdvisorEvaluationDashboardStage) =>
    ["advisor", "evaluator-project-evaluation-dashboard", stage] as const,
}

export function useEvaluatorProjectEvaluationDashboard(stage: AdvisorEvaluationDashboardStage) {
  return useEvaluatorProjectEvaluationDashboardWithOptions(stage)
}

export function useEvaluatorProjectEvaluationDashboardWithOptions(
  stage: AdvisorEvaluationDashboardStage,
  options?: { enabled?: boolean }
) {
  return useQuery<EvaluatorProjectEvaluationDashboard, Error>({
    queryKey: evaluatorProjectEvaluationDashboardKeys.stage(stage),
    queryFn: () => getEvaluatorProjectEvaluationDashboard(stage),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    retry: 1,
  })
}