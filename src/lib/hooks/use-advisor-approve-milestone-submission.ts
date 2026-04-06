"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { approveAdvisorMilestoneSubmission } from "@/lib/api/advisor"

export function useAdvisorApproveMilestoneSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      milestoneId,
      submissionId,
    }: {
      milestoneId: string
      submissionId: string
    }) => approveAdvisorMilestoneSubmission(milestoneId, submissionId),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["advisor", "review-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["advisor", "projects"] }),
        queryClient.invalidateQueries({ queryKey: ["advisor", "summary"] }),
        queryClient.invalidateQueries({
          queryKey: ["advisor", "milestone-feedbacks", variables.milestoneId, variables.submissionId],
        }),
      ])
    },
  })
}