"use client"

import { useQuery } from "@tanstack/react-query"
import { getAdvisorSummary } from "@/lib/api/advisor"

export function useAdvisorSummary() {
  return useQuery({
    queryKey: ["advisor", "summary"],
    queryFn: getAdvisorSummary,
  })
}
