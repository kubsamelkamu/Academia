"use client"

import { useQuery } from "@tanstack/react-query"
import { listAdvisorMilestoneSubmissionFeedbacks } from "@/lib/api/advisor"
import type { AdvisorMilestoneSubmissionFeedbackItem } from "@/lib/types/advisor"

export function useAdvisorMilestoneFeedbacks(params: {
  milestoneId: string | null | undefined
  submissionId: string | null | undefined
  enabled?: boolean
}) {
  const milestoneId = params.milestoneId?.trim() ? params.milestoneId.trim() : null
  const submissionId = params.submissionId?.trim() ? params.submissionId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(milestoneId) && Boolean(submissionId)

  return useQuery<AdvisorMilestoneSubmissionFeedbackItem[], Error>({
    queryKey: enabled
      ? ["advisor", "milestone-feedbacks", milestoneId ?? "", submissionId ?? ""]
      : ["advisor", "milestone-feedbacks"],
    queryFn: () => {
      if (!milestoneId || !submissionId) {
        throw new Error("milestoneId and submissionId are required")
      }

      return listAdvisorMilestoneSubmissionFeedbacks(milestoneId, submissionId)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
