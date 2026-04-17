"use client"

import { useMutation } from "@tanstack/react-query"

import {
  submitAdvisorProjectEvaluation,
  type AdvisorEvaluationDashboardStage,
  type SubmitAdvisorProjectEvaluationResult,
} from "@/lib/api/advisor"

export function useSubmitAdvisorProjectEvaluation() {
  return useMutation<
    SubmitAdvisorProjectEvaluationResult,
    Error,
    {
      projectId: string
      stage: AdvisorEvaluationDashboardStage
    }
  >({
    mutationFn: ({ projectId, stage }) => submitAdvisorProjectEvaluation(projectId, stage),
  })
}