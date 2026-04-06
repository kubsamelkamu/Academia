"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addAdvisorMilestoneSubmissionFeedback } from "@/lib/api/advisor"

export function useAdvisorAddMilestoneFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      milestoneId,
      submissionId,
      message,
      file,
    }: {
      milestoneId: string
      submissionId: string
      message: string
      file?: File | null
    }) => addAdvisorMilestoneSubmissionFeedback(milestoneId, submissionId, message, file),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["advisor", "review-queue"] }),
        queryClient.invalidateQueries({
          queryKey: ["advisor", "milestone-feedbacks", variables.milestoneId, variables.submissionId],
        }),
      ])
    },
  })
}