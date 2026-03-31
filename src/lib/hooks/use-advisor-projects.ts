"use client"

import { useQuery } from "@tanstack/react-query"
import { getAdvisorProjects } from "@/lib/api/advisor"

export function useAdvisorProjects() {
  return useQuery({
    queryKey: ["advisor", "projects"],
    queryFn: getAdvisorProjects,
  })
}
