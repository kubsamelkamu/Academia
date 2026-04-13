"use client"

import { useQuery } from "@tanstack/react-query"

import {
  getAdvisorProjectEvaluationDetail,
  type AdvisorEvaluationDashboardStage,
  type AdvisorProjectEvaluationDetail,
} from "@/lib/api/advisor"

export const advisorProjectEvaluationDetailKeys = {
  root: ["advisor", "project-evaluation-detail"] as const,
  detail: (projectId: string, stage: AdvisorEvaluationDashboardStage) =>
    ["advisor", "project-evaluation-detail", projectId, stage] as const,
}

export function useAdvisorProjectEvaluationDetail(
  projectId: string,
  stage: AdvisorEvaluationDashboardStage,
  options?: { enabled?: boolean }
) {
  const trimmedProjectId = projectId.trim()

  return useQuery<AdvisorProjectEvaluationDetail, Error>({
    queryKey: advisorProjectEvaluationDetailKeys.detail(trimmedProjectId, stage),
    queryFn: () => getAdvisorProjectEvaluationDetail(trimmedProjectId, stage),
    enabled: (options?.enabled ?? true) && Boolean(trimmedProjectId),
    staleTime: 30_000,
    retry: 1,
  })
}