"use client"

import { useMutation } from "@tanstack/react-query"

import {
  saveAdvisorProjectEvaluationDraft,
  type AdvisorEvaluationDashboardStage,
  type SaveAdvisorProjectEvaluationDraftInput,
  type SaveAdvisorProjectEvaluationDraftResult,
} from "@/lib/api/advisor"

export function useSaveAdvisorProjectEvaluationDraft() {
  return useMutation<
    SaveAdvisorProjectEvaluationDraftResult,
    Error,
    {
      projectId: string
      stage: AdvisorEvaluationDashboardStage
      input: SaveAdvisorProjectEvaluationDraftInput
    }
  >({
    mutationFn: ({ projectId, stage, input }) =>
      saveAdvisorProjectEvaluationDraft(projectId, stage, input),
  })
}