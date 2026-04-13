"use client"

import { useQuery } from "@tanstack/react-query"

import {
  getAdvisorProjectEvaluationDashboard,
  type AdvisorEvaluationDashboardStage,
  type AdvisorProjectEvaluationDashboard,
} from "@/lib/api/advisor"

export const advisorProjectEvaluationDashboardKeys = {
  root: ["advisor", "project-evaluation-dashboard"] as const,
  stage: (stage: AdvisorEvaluationDashboardStage) =>
    ["advisor", "project-evaluation-dashboard", stage] as const,
}

export function useAdvisorProjectEvaluationDashboard(stage: AdvisorEvaluationDashboardStage) {
  return useAdvisorProjectEvaluationDashboardWithOptions(stage)
}

export function useAdvisorProjectEvaluationDashboardWithOptions(
  stage: AdvisorEvaluationDashboardStage,
  options?: { enabled?: boolean }
) {
  return useQuery<AdvisorProjectEvaluationDashboard, Error>({
    queryKey: advisorProjectEvaluationDashboardKeys.stage(stage),
    queryFn: () => getAdvisorProjectEvaluationDashboard(stage),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    retry: 1,
  })
}