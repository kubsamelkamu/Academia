"use client"

import { useQuery } from "@tanstack/react-query"
import { getAdvisorMilestoneReviewQueue } from "@/lib/api/advisor"

export function useAdvisorReviewQueue() {
  return useQuery({
    queryKey: ["advisor", "review-queue"],
    queryFn: getAdvisorMilestoneReviewQueue,
  })
}